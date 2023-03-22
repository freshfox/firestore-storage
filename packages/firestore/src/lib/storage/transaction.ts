import { DocumentReference, DocumentSnapshot, Firestore, Transaction } from '@google-cloud/firestore';
import { ModelDataOnly } from 'firestore-storage-core';
import { CollectionPath, DocumentIds } from 'firestore-storage-core/dist/lib/storage/collections';
import { FirestoreStorageError } from 'firestore-storage-core/dist/lib/storage/error';
import { BaseRepository } from './repository';

export class FirestoreTransaction {
	constructor(private firestore: Firestore, private transaction: Transaction) {}

	async find<T, Path extends CollectionPath<any, any, any>>(
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

	async get<T, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		ids: DocumentIds<Path>
	): Promise<T> {
		const doc = await this.find(repo, ids);
		if (!doc) {
			throw new FirestoreStorageError(repo.getPath().path(), ids);
		}
		return doc;
	}

	create<T, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: T,
		ids: DocumentIds<Path>
	): FirestoreTransaction {
		return this.applyToDoc(repo, data, ids, (id, data, doc) => {
			this.transaction.create(doc, data);
		});
	}

	set<T, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: T,
		ids: DocumentIds<Path>
	): FirestoreTransaction {
		return this.applyToDoc(repo, data, ids, (id, data, doc) => {
			this.transaction.set(doc, data, { merge: true });
		});
	}

	write<T, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: T,
		ids: DocumentIds<Path>
	): FirestoreTransaction {
		return this.applyToDoc(repo, data, ids, (id, data, doc) => {
			this.transaction.set(doc, data, { merge: false });
		});
	}

	update<T, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: T,
		ids: DocumentIds<Path>
	): FirestoreTransaction {
		return this.applyToDoc(repo, data, ids, (id, data, doc) => {
			this.transaction.update(doc, data, { exists: true });
		});
	}

	delete<T, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: T,
		ids: DocumentIds<Path>
	): FirestoreTransaction {
		return this.applyToDoc(repo, data, ids, (id, data, doc) => {
			this.transaction.delete(doc, data);
		});
	}

	private applyToDoc<T, Path extends CollectionPath<any, any, any>>(
		repo: BaseRepository<T, Path>,
		data: T,
		ids: DocumentIds<Path>,
		cb: (id: string, data: ModelDataOnly<T>, doc: DocumentReference) => void
	) {
		const d = repo.toFirestoreDocument(data);
		const doc = this.firestore.doc(repo.getDocumentPath(ids));
		cb(d.id, d.data, doc);
		return this;
	}
}
