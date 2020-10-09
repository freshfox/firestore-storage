import * as admin from "firebase-admin";
import {Change, EventContext} from 'firebase-functions';
import QueryDocumentSnapshot = admin.firestore.QueryDocumentSnapshot;
import DocumentSnapshot = admin.firestore.DocumentSnapshot;
import {AnyKeys, BaseModel, ParsedChange, ParsedSnapshot} from "firestore-storage-core";

/**
 * Takes the Firestore change and event context of a Firestore function hook, parses the data and returns a typed result.
 * Pass the path ids ordered by their hierarchical position. The last id will be written on the returned before and after models
 * @param change - Change of the Firestore function
 * @param context - Event context of the Firestore function
 * @param firstId - First and required path id
 * @param idNames - Additional path ids
 */
export function parseFirestoreChange<T extends BaseModel, K extends keyof any>(
	change: Change<QueryDocumentSnapshot<T> | DocumentSnapshot<T>>,
	context: EventContext,
	firstId: K, ...idNames: K[]): ParsedChange<T, K> {

	const {lastId, ids} = getIdMap(context, firstId as string, idNames as string[]);
	return {
		before: data(change.before?.data(), lastId),
		after: data(change.after?.data(), lastId),
		ids
	};
}

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
