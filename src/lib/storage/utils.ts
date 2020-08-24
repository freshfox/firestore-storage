import {BaseModel} from "./base_model";
import * as admin from "firebase-admin";
import {Change, EventContext} from 'firebase-functions';
import QueryDocumentSnapshot = admin.firestore.QueryDocumentSnapshot;

type AnyKeys<K extends keyof any> = Partial<Pick<any, K>>

type ParsedChange<T, K extends keyof any> = {
	before: T;
	after: T;
	ids: AnyKeys<K>
}

/**
 * Takes the Firestore change and event context of a Firestore function hook, parses the data and returns a typed result.
 * Pass the path ids ordered by their hierarchical position. The last id will be written on the returned before and after models
 * @param change - Change of the Firestore function
 * @param context - Event context of the Firestore function
 * @param firstId - First and required path id
 * @param idNames - Additional path ids
 */
export function parseFirestoreChange<T extends BaseModel, K extends keyof any>(change: Change<QueryDocumentSnapshot<T>>, context: EventContext, firstId: K, ...idNames: K[]): ParsedChange<T, K> {
	const before = change.before?.data() || null;
	const after = change.after?.data() || null;
	const ids: AnyKeys<K> = {};
	let lastId;
	idNames.unshift(firstId);
	for (const idName of idNames) {
		const id = context.params[idName as string];
		if (id) {
			lastId = ids[idName as string] = id;
		} else {
			console.error(idName, 'not found in document path', context);
		}
	}
	if (before) {
		before.id = lastId;
	}
	if (after) {
		after.id = lastId;
	}
	return {
		before, after, ids
	};
}
