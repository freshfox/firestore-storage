import { BaseModelClass } from 'firestore-storage-core';
import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from '@google-cloud/firestore';

export function createClassConverter<T extends BaseModelClass<any>>(ModelClass: any): FirestoreDataConverter<T> {
	return {
		toFirestore(data: T): DocumentData {
			return data.getData();
		},
		fromFirestore(snapshot: QueryDocumentSnapshot): T {
			const data = snapshot.data()!;
			return new ModelClass(data);
		},
	};
}
