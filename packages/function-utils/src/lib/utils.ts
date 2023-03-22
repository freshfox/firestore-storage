import { FirestoreChangeValue, FirestoreDocument, FirestoreEvent, FirestoreMapValue, FirestoreValue } from './types';
import * as admin from 'firebase-admin';
import { Change, EventContext } from 'firebase-functions';
import QueryDocumentSnapshot = admin.firestore.QueryDocumentSnapshot;
import DocumentSnapshot = admin.firestore.DocumentSnapshot;
import { AnyKeys, BaseModel, ParsedChange, ParsedSnapshot } from 'firestore-storage-core';

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
	firstId: K,
	...idNames: K[]
): ParsedChange<T, K> {
	const { lastId, ids } = getIdMap(context, firstId as string, idNames as string[]);
	return {
		before: data(change.before?.data(), lastId),
		after: data(change.after?.data(), lastId),
		ids,
	};
}

export function parseFirestoreChangeValue<T>(
	idParameter: string,
	change: FirestoreChangeValue<T>,
	event: FirestoreEvent
): FirestoreDocument<T> | null {
	// Before value is an empty object on creation (not null)
	if (change && Object.keys(change).length) {
		const value: T = parseFirestoreMapValue<T>(change);
		const id = event.params[idParameter];
		if (!id) {
			console.error(event, change);
			throw new Error('Unable to find document id for' + event.resource);
		}
		return {
			id: id,
			createdAt: new Date(change.createTime),
			updatedAt: new Date(change.updateTime),
			data: value,
		};
	}
	return null;
}

function parseFirestoreValue(value: FirestoreValue): any {
	if (value.mapValue) {
		return parseFirestoreMapValue(value.mapValue);
	} else if (value.arrayValue) {
		if (value.arrayValue.values) {
			return value.arrayValue.values.map((value) => {
				return parseFirestoreValue(value);
			});
		} else {
			return [];
		}
	} else if (value.timestampValue) {
		return new Date(value.timestampValue);
	} else if (value.integerValue) {
		return parseInt(value.integerValue, 10);
	}
	return Object.values(value)[0] || null;
}

function parseFirestoreMapValue<T>(value: FirestoreMapValue<T>) {
	const obj = {} as any;
	const keys = Object.keys(value.fields || {}) as Array<keyof T>;
	for (const key of keys) {
		const val = value.fields[key];
		obj[key] = parseFirestoreValue(val);
	}
	return obj;
}

function data<T extends BaseModel>(data: T | undefined, id: string) {
	if (data) {
		data.id = id;
		return data;
	}
	return null;
}

function getIdMap<K>(
	context: EventContext,
	firstId: string,
	idNames: string[]
): { lastId: string; ids: AnyKeys<keyof K> } {
	const ids: AnyKeys<keyof K> = {};
	let lastId;
	idNames.unshift(firstId);
	for (const idName of idNames) {
		const id = context.params[idName];
		if (id) {
			ids[idName as keyof K] = id;
			lastId = id;
		} else {
			console.error(idName, 'not found in document path', context);
		}
	}
	return {
		lastId,
		ids,
	};
}
