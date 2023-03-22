import { BaseModelClass } from 'firestore-storage-core/dist/lib/storage/base_model_v2';
import { Type } from '@nestjs/common';
import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from '@google-cloud/firestore';

export function createClassConverter<T extends BaseModelClass<any>>(ModelClass: Type<T>): FirestoreDataConverter<T> {
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
