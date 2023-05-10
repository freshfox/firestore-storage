import {
	BaseModel,
	BaseRepository,
	CollectionIds,
	CollectionPath,
	ModelDataOnly,
	ModelDataWithId,
	PatchUpdate,
} from 'firestore-storage-core';
import { DocumentReference, Firestore } from '@google-cloud/firestore';

export function applyToDoc<T extends BaseModel, Path extends CollectionPath<any, any, any>, R = void>(
	firestore: Firestore,
	repo: BaseRepository<T, Path, any>,
	data: T | ModelDataOnly<T> | PatchUpdate<ModelDataWithId<T>>,
	ids: CollectionIds<Path>,
	cb: (id: string, data: ModelDataOnly<T>, doc: DocumentReference) => R
) {
	const d = repo.toFirestoreDocument(data);
	const path = repo.getPath();
	const docRef = d.id
		? firestore.doc(repo.getDocumentPath(path.toDocIds(ids, d.id)))
		: firestore.collection(path.collection(ids)).doc();

	return cb(docRef.id, d.data, docRef);
}
