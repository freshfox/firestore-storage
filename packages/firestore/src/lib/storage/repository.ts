import {
	BaseRepository as CoreBaseRepository,
	CollectionIds,
	CollectionPath,
	DocumentIds,
	BaseModel,
	ModelQuery,
	PatchUpdate,
	ModelDataOnly,
	FirestoreStorageError,
	ModelDataWithId,
} from 'firestore-storage-core';
import { Query } from './query';
import { DocumentReference, DocumentSnapshot, Firestore } from '@google-cloud/firestore';
import { applyToDoc } from './utils';
import { IDocumentTransformer } from 'firestore-storage-core/dist/cjs';

export abstract class BaseRepository<
	T extends BaseModel,
	Path extends CollectionPath<any, any, any>
> extends CoreBaseRepository<T, Path, DocumentSnapshot<T>> {
	constructor(protected firestore: Firestore) {
		super();
	}

	fromFirestoreToObject(snapshot: DocumentSnapshot<T>) {
		if (!snapshot.exists) {
			return null;
		}
		const transformer: IDocumentTransformer<T> = this.getTransformer();
		return transformer.fromFirestoreToObject(snapshot.data() as ModelDataOnly<T>, {
			id: snapshot.id,
			rawPath: snapshot.ref.path,
		});
	}

	/**
	 *
	 */
	async findById(ids: DocumentIds<Path>): Promise<T | null> {
		const doc = await this.firestore.doc(this.getDocumentPath(ids)).get();
		return this.fromFirestoreToObject(doc as any);
	}

	async getById(ids: DocumentIds<Path>): Promise<T> {
		const doc = await this.findById(ids);
		if (doc) {
			return doc;
		}
		throw new FirestoreStorageError(this.getPath().path(), ids);
	}

	async find(attributes: ModelQuery<T>, ids: CollectionIds<Path>): Promise<T | null> {
		const documents = await this.list(attributes, ids);
		return documents[0] || null;
	}

	async get(attributes: ModelQuery<T>, ids: CollectionIds<Path>): Promise<T> {
		const doc = await this.find(attributes, ids);
		if (doc) {
			return doc;
		}
		throw new FirestoreStorageError(this.getPath().path(), ids);
	}

	list(attributes: ModelQuery<T> | null, ids: CollectionIds<Path>): Promise<T[]> {
		return this.query((q) => {
			return q.whereAll(attributes);
		}, ids);
	}

	async query(cb: (qb: Query<T>) => Query<T>, ids: CollectionIds<Path>): Promise<T[]> {
		const path = this.getCollectionPath(ids);
		const query = new Query<T>(this.firestore.collection(path));
		const result = await cb(query).execute();
		if (result.empty) {
			return [];
		}
		return result.docs.map((doc) => {
			return this.fromFirestoreToObject(doc)!;
		});
	}

	async groupQuery(cb?: (qb: Query<T>) => Query<T>): Promise<T[]> {
		const group = this.firestore.collectionGroup(this.getCollectionName());
		const result = await (cb ? cb(new Query<T>(group)).execute() : group.get());
		if (result.empty) {
			return [];
		}
		return result.docs.map((doc) => {
			return this.fromFirestoreToObject(doc as any)!;
		});
	}

	async findAll(documentIds: string[], ids: CollectionIds<Path>): Promise<(T | null)[]> {
		if (documentIds.length === 0) {
			return [];
		}

		const path = this.getCollectionPath(ids);
		const docRefs: DocumentReference[] = documentIds.map((id) => {
			return this.firestore.collection(path).doc(id);
		});
		const result = await this.firestore.getAll(...docRefs);
		return result.map((document) => {
			return this.fromFirestoreToObject(document as any);
		});
	}

	async getAll(documentIds: string[], ids: CollectionIds<Path>): Promise<T[]> {
		const all = await this.findAll(documentIds, ids);
		for (const id of documentIds) {
			const doc = all.find((d) => d?.id === id);
			if (!doc) {
				throw new FirestoreStorageError(this.getPath().path(), ids);
			}
		}
		return all;
	}

	async count(cb: (qb: Query<T>) => Query<T>, ids: CollectionIds<Path>) {
		const path = this.getCollectionPath(ids);
		const query = new Query<T>(this.firestore.collection(path));
		const result = await cb(query).count().get();
		return result.data().count;
	}

	async create(data: T | ModelDataOnly<T>, ids: CollectionIds<Path>): Promise<T> {
		return this.applyToDocRef(data, ids, (doc, data) => {
			return doc.create(data);
		});
	}

	/**@deprecated use upsert instead*/
	async save(data: T | ModelDataOnly<T> | PatchUpdate<ModelDataWithId<T>>, ids: CollectionIds<Path>): Promise<T> {
		return this.applyToDocRef(data, ids, (doc, data) => {
			return doc.set(data, {
				merge: true,
			});
		});
	}

	async upsert(data: T | ModelDataOnly<T>, ids: CollectionIds<Path>): Promise<T> {
		return this.applyToDocRef(data, ids, (doc, data) => {
			return doc.set(data, {
				merge: true,
			});
		});
	}

	async write(data: T | ModelDataOnly<T>, ids: CollectionIds<Path>): Promise<T> {
		return this.applyToDocRef(data, ids, (doc, data) => {
			return doc.set(data, {
				merge: false,
			});
		});
	}

	async update(data: T | PatchUpdate<ModelDataWithId<T>>, ids: CollectionIds<Path>): Promise<T> {
		return this.applyToDocRef(data, ids, (doc, data) => {
			return doc.update(data);
		});
	}

	private async applyToDocRef(
		data: T | ModelDataOnly<T> | PatchUpdate<ModelDataWithId<T>>,
		ids: CollectionIds<Path>,
		cb: (doc: DocumentReference, data: ModelDataOnly<T>) => Promise<any>
	) {
		return applyToDoc(this.firestore, this, data, ids, async (id, data, docRef) => {
			try {
				await cb(docRef, data);
			} catch (err) {
				throw new FirestoreStorageError(this.getPath().path(), ids, err.message);
			}
			const doc = await docRef.get();
			return this.fromFirestoreToObject(doc as DocumentSnapshot<T>);
		});
	}

	async delete(ids: DocumentIds<Path>): Promise<void> {
		const path = this.getDocumentPath(ids);
		await this.firestore.doc(path).delete();
	}

	generateId() {
		return this.firestore.collection('any').doc().id;
	}
}
