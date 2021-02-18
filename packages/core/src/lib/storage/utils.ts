import * as isPlainObject from 'lodash.isplainobject';
import * as isEqual from 'lodash.isequal';
import {PathFunction} from "./collection_utils";

export type AnyKeys<K extends keyof any> = {
	[P in keyof Pick<any, K>]?: string;
}

export type ParsedChange<T, K extends keyof any> = {
	before: T;
	after: T;
	ids: AnyKeys<K>
}

export type ParsedSnapshot<T, K extends keyof any> = {
	data: T;
	ids: AnyKeys<K>
}

export class DocumentChange<T, K extends keyof any> {

	readonly changedKeys: string[];

	constructor(private change: ParsedChange<T, K>) {
		if (change.after) {
			const allKeys = Object.keys(change.after);
			if (change.before) {
				this.changedKeys = allKeys.filter((key) => {
					return !DocumentChange.eql(change.before[key], change.after[key]);
				});
			} else {
				this.changedKeys = allKeys;
			}
		} else {
			this.changedKeys = [];
		}
	}

	get before() {
		return this.change.before;
	}

	get after() {
		return this.change.after;
	}

	get ids() {
		return this.change.ids;
	}

	hasChanged(...keys: (keyof T)[]) {
		for (const key of keys) {
			if (this.changedKeys.includes(key as string)) {
				return true;
			}
		}
		return false;
	}

	private static eql(v1: any, v2: any) {
		if (isPlainObject(v1) && isPlainObject(v2)) {
			return isEqual(v1, v2);
		}
		return toComparableValue(v1) === toComparableValue(v2);
	}

}

export function isTimestamp(value: any) {
	if (!value) {
		return false;
	}
	return value.hasOwnProperty('_seconds')
		&& value.hasOwnProperty('_nanoseconds');
}

export function toComparableValue(val: any) {
	if (val instanceof Date) return val.getTime();
	if (isTimestamp(val)) return val.toMillis();
	return val;
}

export function parsePath(path: string): Map<string, string> {
	if (path.startsWith('/')) {
		path = path.substring(1);
	}
	const parts = path.split('/');
	const ids = new Map<string, string>();
	for (let i = 0; i < parts.length; i += 2) {
		ids.set(parts[i], parts[i + 1] || null)
	}
	return ids;
}

export function parsePathWithFunction(func: PathFunction, path: string): Map<string, string> {
	const finalMap = new Map<string, string>();
	const map = parsePath(path);
	for (const [collection, id] of map) {
		const idName = func.collectionIdMap.get(collection);
		if (!idName) {
			throw new Error(`Paths don't match (${path} != ${func.path})`);
		}
		finalMap.set(idName, id)
	}
	return finalMap;
}
