import {FirestoreInstance, IFirestoreTransaction, IStorageDriver, QueryBuilder, SaveOptions} from './storage';
import {inject, injectable} from 'inversify';
import * as admin from 'firebase-admin';
import {MemoryStorage} from "./memory_storage";
import DocumentReference = admin.firestore.DocumentReference;

export interface FirestoreStorageExportOptions {
	parallelCollections?: number;
	parallelDocuments?: number;
}

@injectable()
export class FirestoreStorage implements IStorageDriver {

	private static readonly EXPORT_OPTIONS: FirestoreStorageExportOptions = {
		parallelCollections: 20,
		parallelDocuments: 500
	}

	constructor(@inject(FirestoreInstance) protected firestore: admin.firestore.Firestore, ) {
	}

	static clone(data): { id: string, data } {
		const clone = Object.assign({}, data);
		const id = data.id;
		delete clone.id;
		delete clone.createdAt;
		delete clone.updatedAt;
		return {
			id: id,
			data: clone
		};
	}

	static format(snapshot: FirebaseFirestore.DocumentSnapshot) {
		if (!snapshot.exists) {
			return null;
		}
		return Object.assign({
			id: snapshot.id,
			createdAt: new Date(snapshot.createTime.toMillis()),
			updatedAt: new Date(snapshot.updateTime.toMillis())
		}, snapshot.data()) as any;
	}

	private static getPath(collection: string, id: string) {
		return `${collection}/${id}`;
	}

	async findById(collection: string, id: string) {
		const path = FirestoreStorage.getPath(collection, id);
		const snapshot = await this.firestore.doc(path).get();
		return FirestoreStorage.format(snapshot);
	}

	async find<T>(collection: string, cb: (qb: QueryBuilder<T>) => QueryBuilder<T>) {
		const result = await this.query(collection, (qb) => {
			return cb(qb).limit(1);
		});
		return result[0] || null;
	}

	async save(collection: string, data: any, options?: SaveOptions) {
		const model = FirestoreStorage.clone(data);
		if (!model.id) {
			return this.add(collection, model.data)
		}
		return this.internalUpdate(collection, model.id, model.data, options);
	}

	async update(collection: string, data: any, options?: SaveOptions) {
		const clone = FirestoreStorage.clone(data);
		if (!clone.id) {
			return this.add(collection, clone.data)
		}
		const path = FirestoreStorage.getPath(collection, clone.id);
		const docRef = await this.firestore.doc(path);
		const shouldMerge = !(options && options.avoidMerge);
		await docRef.update(clone.data, {
			merge: shouldMerge
		});
		const model = await docRef.get();
		return FirestoreStorage.format(model);
	}

	async query<T>(collection: string, cb?: (qb: QueryBuilder<T>) => QueryBuilder<T>) {
		const qb = this.firestore.collection(collection);
		const query = cb ? cb(qb) : qb;
		const result: FirebaseFirestore.QuerySnapshot = await query.get();
		if (result.empty) {
			return [];
		}
		return result.docs.map((document) => {
			return FirestoreStorage.format(document);
		});
	}

	listen<T>(collection: string, cb: (qb: QueryBuilder<T>) => QueryBuilder<T>,
			  onNext: (snapshot: any) => void, onError?: (error: Error) => void): () => void {
		const qb = this.firestore.collection(collection);
		const query = cb(qb);
		return query.onSnapshot((snapshot: FirebaseFirestore.QuerySnapshot) => {
			let result = [];
			if (!snapshot.empty) {
				result = snapshot.docs.map((document) => {
					return FirestoreStorage.format(document);
				});
				onNext(result);
			}
		}, onError) as () => void;
	}

	async batchGet(collection: string, ids: string[]): Promise<any> {
		if (ids.length === 0) {
			return [];
		}

		const docRefs: DocumentReference[] = ids.map((id) => {
			return this.firestore.collection(collection).doc(id);
		});
		const restDocRefs = docRefs.slice(1);
		const result = await this.firestore.getAll(docRefs[0], ...restDocRefs);
		return result.map((document) => {
			return FirestoreStorage.format(document);
		});
	}

	async transaction<T>(updateFunction: (firestoreTrx: IFirestoreTransaction) => Promise<T>,
						 transactionOptions?: { maxAttempts?: number }) {
		return this.firestore.runTransaction((transaction) => {
			const trx = new FirestoreTransaction(this.firestore, transaction);
			return updateFunction(trx);
		}, transactionOptions);
	}

	async delete(collection: string, id: string) {
		const qb = this.firestore.collection(collection);
		await qb.doc(id).delete()
	}

	async clear(collection: string) {
		if (collection) {
			return this.deleteCollection(collection, 10);
		}
	}

	generateId(): string {
		return this.firestore.collection('').doc().id;
	}

	async export(rootDoc?: string, options?: FirestoreStorageExportOptions) {
		const opts = {
			...FirestoreStorage.EXPORT_OPTIONS,
			...(options || {})
		};
		console.log(`Exporting ${opts.parallelCollections} collections in parallel and ${opts.parallelDocuments} documents in parallel`);
		const storage = new MemoryStorage();
		let root: DocumentReference | admin.firestore.Firestore;
		if (rootDoc) {
			root = await this.firestore.doc(rootDoc);
			const snapshot = await root.get();
			const data = FirestoreStorage.format(snapshot);
			if (data) {
				await storage.save(root.parent.path, data);
			}
		} else {
			root = this.firestore;
		}
		await this.exportDocument(storage, root, opts);
		return storage.data.toJson();
	}

	private async exportDocument(storage: MemoryStorage, root: DocumentReference | admin.firestore.Firestore, opts: FirestoreStorageExportOptions) {
		const docStart = Date.now();
		const collections = await root.listCollections();
		const exportColl = async (coll: admin.firestore.CollectionReference<admin.firestore.DocumentData>) => {
			const collStart = Date.now();
			const query = await coll.get();
			await FirestoreStorage.processPromisesParallel(query.docs, opts.parallelDocuments, async (doc) => {
				await storage.save(coll.path, FirestoreStorage.format(doc));
				await this.exportDocument(storage, doc.ref, opts);
			})
			console.log('Exported', coll.path, 'in', time(Date.now() - collStart));
		}
		await FirestoreStorage.processPromisesParallel(collections, opts.parallelCollections, async (coll) => {
			await exportColl(coll);
		})
		let path = 'database';
		if (root instanceof DocumentReference) {
			path = root.path;
		}
		console.log('Exported', path, 'in', time(Date.now() - docStart));
	}

	private async add(collection: string, data: any): Promise<any> {
		const result = await this.firestore.collection(collection).add(data);
		const model = await result.get();
		return FirestoreStorage.format(model);
	}

	private async internalUpdate(collection: string, id: string, data: any, options?: SaveOptions) {
		const path = FirestoreStorage.getPath(collection, id);
		const docRef = await this.firestore.doc(path);
		await docRef.set(data, {
			merge: !(options && options.avoidMerge)
		});
		const model = await docRef.get();
		return FirestoreStorage.format(model);
	}

	private deleteCollection(collectionPath, batchSize) {
		const collectionRef = this.firestore.collection(collectionPath);
		const query = collectionRef.orderBy('__name__',).limit(batchSize);

		return new Promise((resolve, reject) => {
			this.deleteQueryBatch(query, batchSize, resolve, reject);
		});
	}

	private deleteQueryBatch(query, batchSize, resolve, reject) {
		query.get()
			.then((snapshot) => {
				// When there are no documents left, we are done
				if (snapshot.size == 0) {
					return 0;
				}

				// Delete documents in a batch
				const batch = this.firestore.batch();
				snapshot.docs.forEach((doc) => {
					batch.delete(doc.ref);
				});

				return batch.commit().then(() => {
					return snapshot.size;
				});
			}).then((numDeleted) => {
			if (numDeleted === 0) {
				resolve();
				return;
			}

			// Recurse on the next process tick, to avoid
			// exploding the stack.
			process.nextTick(() => {
				this.deleteQueryBatch(query, batchSize, resolve, reject);
			});
		})
			.catch(reject);
	}

	private static async processPromisesParallel<T, K>(items: T[], batchSize: number,
													   handler: (item: T) => Promise<K>,
													   onUpdate?: (status: {
														   running: number,
														   done: number,
														   total: number,
														   queued: number
													   }) => void): Promise<K[]> {
		items = [...items];
		const all: K[] = [];

		const total = items.length;
		let done = 0;
		let running = 0;

		function update() {
			if (onUpdate) onUpdate({
				running,
				done,
				total: total,
				queued: total - (done + running)
			});
		}
		async function executeNext() {
			const item = items.shift();
			if (!item) {
				return;
			}
			running++;
			update();
			const result = await handler(item);
			all.push(result);
			running--;
			done++;
			update();
			if (items.length > 0) {
				await executeNext();
			}
		}
		const promises = [];
		for (let i = 0; i < batchSize; i++) {
			promises.push(executeNext());
		}
		await Promise.all(promises);
		return all;
	}
}

export class FirestoreTransaction implements IFirestoreTransaction {

	constructor(private firestore: admin.firestore.Firestore, private transaction: FirebaseFirestore.Transaction) {

	}

	async query<T>(collectionPath: string, cb: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<T[]> {
		//this.transaction.get()
		const q = this.firestore.collection(collectionPath);
		const result = await this.transaction.get(cb(q) as FirebaseFirestore.Query);
		if (result.empty) {
			return [];
		}
		return result.docs.map((document) => {
			return FirestoreStorage.format(document);
		});
	}

	async get<T>(collectionPath: string, docId: string): Promise<T> {
		const doc = this.firestore.collection(collectionPath).doc(docId);
		const data = await this.transaction.get(doc);
		if (data.exists) {
			return FirestoreStorage.format(data);
		}
		return null;
	}

	create<T>(collectionPath: string, data: T): FirestoreTransaction {
		const model = FirestoreStorage.clone(data);
		const doc = this.firestore.collection(collectionPath).doc();
		this.transaction.create(doc, model.data);
		return this;
	};

	set<T>(collectionPath: string, data: T): FirestoreTransaction {
		const model = FirestoreStorage.clone(data);
		//model.id can be null
		const doc = this.firestore.collection(collectionPath).doc(model.id);
		this.transaction.set(doc, model.data, {
			merge: true
		});
		return this;
	}

	setAvoidMerge<T>(collectionPath: string, data: T): FirestoreTransaction {
		const model = FirestoreStorage.clone(data);
		//model.id can be null
		const doc = this.firestore.collection(collectionPath).doc(model.id);
		this.transaction.set(doc, model.data, {
			merge: false
		});
		return this;
	}

	update<T>(collectionPath: string, data: T): FirestoreTransaction {
		const model = FirestoreStorage.clone(data);
		const doc = this.firestore.collection(collectionPath).doc(model.id);
		this.transaction.update(doc, model.data);
		return this;
	}

	delete(collectionPath: string, docId: string): FirestoreTransaction {
		const doc = this.firestore.collection(collectionPath).doc(docId);
		this.transaction.delete(doc);
		return this;
	}
}

function time(ms: number): string {
	if (ms < 1000) {
		return `${ms}ms`
	}
	const seconds = Math.round(ms / 10) / 100;
	return `${seconds}s`;
}
