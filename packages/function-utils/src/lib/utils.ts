import {FirestoreChangeValue, FirestoreDocument, FirestoreEvent, FirestoreMapValue, FirestoreValue} from "./types";

export function parseFirestoreChangeValue<T>(idParameter: string, change: FirestoreChangeValue<T>, event: FirestoreEvent): FirestoreDocument<T> | null {
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
			data: value
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
				return parseFirestoreValue(value)
			});
		} else {
			return [];
		}
	} else if (value.timestampValue) {
		return new Date(value.timestampValue)
	} else if (value.integerValue) {
		return parseInt(value.integerValue, 10)
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
