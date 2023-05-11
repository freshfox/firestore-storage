import * as admin from 'firebase-admin';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import QueryDocumentSnapshot = admin.firestore.QueryDocumentSnapshot;
import DocumentSnapshot = admin.firestore.DocumentSnapshot;
import {
	BaseModel,
	CollectionPath,
	IDocumentTransformer,
	DEFAULT_DOCUMENT_TRANSFORMER,
	DocumentIds,
} from 'firestore-storage-core';

type ParsedChange<T, TIds> = {
	before: T | null;
	after: T | null;
	ids: TIds;
};

type ParsedSnapshot<T, TIds> = {
	data: T | null;
	ids: TIds;
};

export function parseFirestoreChange<T extends BaseModel, TCollPath extends CollectionPath<any, any, any>>(
	event: FirestoreEvent<Change<QueryDocumentSnapshot | DocumentSnapshot> | undefined>,
	path: TCollPath,
	transformer?: IDocumentTransformer<T>
): ParsedChange<T, DocumentIds<TCollPath>> {
	const ids = path.parse(event.document);
	transformer = transformer || (DEFAULT_DOCUMENT_TRANSFORMER as IDocumentTransformer<T>);
	return {
		ids: ids,
		before: transform<T>(event.data?.before, transformer) as T,
		after: transform<T>(event.data?.after, transformer) as T,
	};
}

export function parseFirestoreCreate<T extends BaseModel, TCollPath extends CollectionPath<any, any, any>>(
	event: FirestoreEvent<QueryDocumentSnapshot | undefined>,
	path: TCollPath,
	transformer?: IDocumentTransformer<T>
): ParsedSnapshot<T, DocumentIds<TCollPath>> {
	const ids = path.parse(event.document);
	transformer = transformer || (DEFAULT_DOCUMENT_TRANSFORMER as IDocumentTransformer<T>);
	return {
		ids: ids,
		data: transform<T>(event.data, transformer) as T,
	};
}

function transform<T extends BaseModel>(
	doc: DocumentSnapshot | undefined,
	transformer: IDocumentTransformer<T>
): T | null {
	const data = doc?.data();
	if (doc && data) {
		return transformer.fromFirestoreToObject(data as any, {
			id: doc.id,
			rawPath: doc.ref.path,
		});
	}
	return null;
}
