import {Change, EventContext} from 'firebase-functions';
import {AnyKeys, BaseModel, ParsedSnapshot} from "firestore-storage-core";
import { QueryDocumentSnapshot } from '@google-cloud/firestore';

export function parseFirestoreSnapshot<T extends BaseModel, K extends keyof any> (
	snapshot: QueryDocumentSnapshot<T>,
	context: EventContext,
	firstId: K, ...idNames: K[]): ParsedSnapshot<T, K>{
	const {lastId, ids} = getIdMap(context, firstId as string, idNames as string[]);
	return {
		data: data(snapshot.data(), lastId),
		ids
	};
}

function data<T extends BaseModel>(data: T, id: string) {
	if (data) {
		data.id = id;
		return data;
	}
	return null;
}

function getIdMap<K>(context: EventContext, firstId: string, idNames: string[]): {lastId: string, ids: AnyKeys<keyof K>} {
	const ids: AnyKeys<keyof K> = {};
	let lastId;
	idNames.unshift(firstId);
	for (const idName of idNames) {
		const id = context.params[idName];
		if (id) {
			lastId = ids[idName as string] = id;
		} else {
			console.error(idName, 'not found in document path', context);
		}
	}
	return {
		lastId, ids
	}
}
