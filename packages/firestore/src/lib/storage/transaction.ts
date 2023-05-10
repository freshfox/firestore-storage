import { DocumentReference, DocumentSnapshot, Firestore, Transaction } from '@google-cloud/firestore';
import {
	ModelDataOnly,
	BaseModel,
	CollectionPath,
	CollectionIds,
	FirestoreStorageError,
	DocumentIds,
	PatchUpdate,
	ModelDataWithId,
} from 'firestore-storage-core';
import { BaseRepository } from './repository';
import { applyToDoc } from './utils';

export class FirestoreTransaction {
	constructor(private firestore: Firestore, private transaction: Transaction) {}

	async find<T extends BaseModel, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		ids: DocumentIds<Path>
	): Promise<T | null> {
		const doc = this.firestore.doc(repo.getDocumentPath(ids));
		const data = await this.transaction.get(doc);
		if (data.exists) {
			return repo.fromFirestoreToObject(data as DocumentSnapshot<T>);
		}
		return null;
	}

	async get<T extends BaseModel, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		ids: DocumentIds<Path>
	): Promise<T> {
		const doc = await this.find(repo, ids);
		if (!doc) {
			throw new FirestoreStorageError(repo.getPath().path(), ids);
		}
		return doc;
	}

	create<T extends BaseModel, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: T | ModelDataOnly<T>,
		ids: CollectionIds<Path>
	): FirestoreTransaction {
		return this.applyToDoc(repo, data, ids, (id, data, doc) => {
			this.transaction.create(doc, data);
		});
	}

	save<T extends BaseModel, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: T | ModelDataOnly<T> | PatchUpdate<ModelDataWithId<T>>,
		ids: CollectionIds<Path>
	): FirestoreTransaction {
		return this.applyToDoc(repo, data, ids, (id, data, doc) => {
			this.transaction.set(doc, data, { merge: true });
		});
	}

	write<T extends BaseModel, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: T | ModelDataOnly<T>,
		ids: CollectionIds<Path>
	): FirestoreTransaction {
		return this.applyToDoc(repo, data, ids, (id, data, doc) => {
			this.transaction.set(doc, data, { merge: false });
		});
	}

	update<T extends BaseModel, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: PatchUpdate<ModelDataWithId<T>>,
		ids: CollectionIds<Path>
	): FirestoreTransaction {
		return this.applyToDoc(repo, data, ids, (id, data, doc) => {
			this.transaction.update(doc, data, { exists: true });
		});
	}

	delete<T extends BaseModel, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		ids: DocumentIds<Path>
	): FirestoreTransaction {
		const ref = this.firestore.doc(repo.getDocumentPath(ids));
		this.transaction.delete(ref);
		return this;
	}

	private applyToDoc<T extends BaseModel, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: T | ModelDataOnly<T> | PatchUpdate<ModelDataWithId<T>>,
		ids: CollectionIds<Path>,
		cb: (id: string, data: ModelDataOnly<T>, doc: DocumentReference) => void
	) {
		return applyToDoc(this.firestore, repo, data, ids, (id, data, doc) => {
			cb(id, data, doc);
			return this;
		});
	}
}
