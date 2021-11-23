import {firestore} from "firebase-admin";
import {BaseModelClass} from "firestore-storage-core/dist/lib/storage/base_model_v2";
import {Type} from "@nestjs/common";

export function createClassConverter<T extends BaseModelClass<any>>(ModelClass: Type<T>): firestore.FirestoreDataConverter<T>  {
	return {
		toFirestore(data: T): firestore.DocumentData {
			return data.getData();
		},
		fromFirestore(snapshot: firestore.QueryDocumentSnapshot): T {
			const data = snapshot.data()!;
			return new ModelClass(data);
		}
	};
}
