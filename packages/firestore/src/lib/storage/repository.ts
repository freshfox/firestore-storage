import 'reflect-metadata';
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
} from 'firestore-storage-core';
import { Query } from './query';
import { DocumentReference, DocumentSnapshot, Firestore } from '@google-cloud/firestore';

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
		return this.getTransformer().fromFirestoreToObject(snapshot.data(), {
			id: snapshot.id,
			createdAt: new Date(snapshot.createTime.toMillis()),
			updatedAt: new Date(snapshot.updateTime.toMillis()),
			rawPath: snapshot.ref.path,
		});
	}

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
			return this.fromFirestoreToObject(doc);
		});
	}

	async groupQuery(cb?: (qb: Query<T>) => Query<T>): Promise<T[]> {
		const group = this.firestore.collectionGroup(this.getCollectionName());
		const result = await (cb ? cb(new Query<T>(group)).execute() : group.get());
		if (result.empty) {
			return [];
		}
		return result.docs.map((doc) => {
			return this.fromFirestoreToObject(doc as any);
		});
	}

	async findAll(documentIds: string[], ids: CollectionIds<Path>): Promise<(T | null)[]> {
		if (ids.length === 0) {
			return [];
		}

		const path = this.getCollectionPath(ids);
		const docRefs: DocumentReference[] = ids.map((id) => {
			return this.firestore.collection(path).doc(id);
		});
		const restDocRefs = docRefs.slice(1);
		const result = await this.firestore.getAll(docRefs[0], ...restDocRefs);
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

	async save(data: T | ModelDataOnly<T> | PatchUpdate<ModelDataOnly<T>>, ids: CollectionIds<Path>): Promise<T> {
		return this.applyToDocRef(data, ids, (doc, data) => {
			return doc.set(data, {
				merge: true,
			});
		});
	}

	async write(data: T | ModelDataOnly<T> | PatchUpdate<ModelDataOnly<T>>, ids: CollectionIds<Path>): Promise<T> {
		return this.applyToDocRef(data, ids, (doc, data) => {
			return doc.set(data, {
				merge: false,
			});
		});
	}

	async update(data: T | PatchUpdate<ModelDataOnly<T>>, ids: CollectionIds<Path>): Promise<T> {
		return this.applyToDocRef(data, ids, (doc, data) => {
			return doc.update(data);
		});
	}

	private async applyToDocRef(
		data: T | ModelDataOnly<T> | PatchUpdate<ModelDataOnly<T>>,
		ids: CollectionIds<Path>,
		cb: (doc: DocumentReference, data: ModelDataOnly<T>) => Promise<any>
	) {
		const d = this.toFirestoreDocument(data as T);
		const collectionRef = this.firestore.collection(this.getCollectionPath(ids));
		const docRef = d.id ? collectionRef.doc(d.id) : collectionRef.doc();
		try {
			await cb(docRef, d.data);
		} catch (err) {
			throw new FirestoreStorageError(this.getPath().path(), ids, err.message);
		}
		const doc = await docRef.get();
		return this.fromFirestoreToObject(doc as DocumentSnapshot<T>);
	}

	async delete(ids: DocumentIds<Path>): Promise<void> {
		const path = this.getDocumentPath(ids);
		await this.firestore.doc(path).delete();
	}

	generateId() {
		return this.firestore.collection('any').doc().id;
	}
}