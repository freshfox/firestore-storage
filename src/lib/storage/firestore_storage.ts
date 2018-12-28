import {QueryBuilder, IStorageDriver, SaveOptions, FirestoreInstance} from './storage';
import {inject, injectable} from 'inversify';
import * as admin from 'firebase-admin';
import {DocumentSnapshot, QuerySnapshot} from '@google-cloud/firestore';
import DocumentReference = FirebaseFirestore.DocumentReference;

@injectable()
export class FirestoreStorage implements IStorageDriver {

	constructor(@inject(FirestoreInstance) protected firestore: admin.firestore.Firestore) {
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
		return this.update(collection, model.id, model.data, options);
	}

	private async add(collection: string, data: any): Promise<any> {
		const result = await this.firestore.collection(collection).add(data);
		const model = await result.get();
		return FirestoreStorage.format(model);
	}

	private async update(collection: string, id: string, data: any, options?: SaveOptions) {
		const path = FirestoreStorage.getPath(collection, id);
		const docRef = await this.firestore.doc(path);
		await docRef.set(data, {
			merge: !(options && options.avoidMerge)
		});
		const model = await docRef.get();
		return FirestoreStorage.format(model);
	}

	async query<T>(collection: string, cb?: (qb: QueryBuilder<T>) => QueryBuilder<T>) {
		const qb = this.firestore.collection(collection);
		const query = cb ? cb(qb) : qb;
		const result: QuerySnapshot = await query.get();
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
		return query.onSnapshot((snapshot: QuerySnapshot) => {
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

	async delete(collection: string, id: string) {
		const qb = this.firestore.collection(collection);
		await qb.doc(id).delete()
	}

	async clear(collection: string) {
		if (collection) {
			return this.deleteCollection(collection, 10);
		}
	}

	private deleteCollection(collectionPath, batchSize) {
		const collectionRef = this.firestore.collection(collectionPath);
		const query = collectionRef.orderBy('__name__', ).limit(batchSize);

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

	private static clone(data): {id: string, data} {
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

	private static getPath(collection: string, id: string) {
		return `${collection}/${id}`;
	}

	private static format(snapshot: DocumentSnapshot) {
		if (!snapshot.exists) {
			return null;
		}
		return Object.assign({
			id: snapshot.id,
			createdAt: new Date(snapshot.createTime.toMillis()),
			updatedAt: new Date(snapshot.updateTime.toMillis())
		}, snapshot.data()) as any;
	}
}
