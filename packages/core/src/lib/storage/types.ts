declare const t: unique symbol;
export type Id<T> = string & { readonly [t]: T };

export interface BaseModel extends Record<string, unknown> {
	id: string;
	_rawPath: string;
}

type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

type Clonable<T> = {
	[K in keyof NonFunctionProperties<T>]: T[K] extends object ? Clonable<T[K]> : T[K];
};

export type FlattenObjectKeys<T extends Record<string, unknown>, Key = keyof T> = Key extends string
	? T[Key] extends Record<string, unknown>
		? `${Key}.${FlattenObjectKeys<T[Key]>}`
		: `${Key}`
	: never;

export type ModelDataOnly<T> = Omit<Clonable<T>, keyof BaseModel>;

export type ModelQuery<T extends BaseModel> = Partial<ModelDataOnly<T>>;

export interface ReferenceMap {
	[id: string]: boolean;
}

export function toReferenceMap(...entities: BaseModel[]): ReferenceMap {
	return entities.reduce((map: ReferenceMap, entity: BaseModel) => {
		map[entity.id] = true;
		return map;
	}, {});
}

export function toReferenceMapFromIds(ids: string[], value: any = true): ReferenceMap {
	return ids.reduce((map, id) => {
		map[id] = value;
		return map;
	}, {});
}

export function isSameReferenceMap(r1: ReferenceMap, r2: ReferenceMap) {
	const ids1 = Object.keys(r1);
	const ids2 = Object.keys(r2);
	if (ids1.length !== ids2.length) {
		return false;
	}
	for (const id of ids1) {
		if (ids2.indexOf(id) === -1) {
			return false;
		}
	}
	return true;
}

type NestedPartial<T> = {
	[K in keyof T]?: T[K] extends Array<infer R> ? Array<R> : NestedPartial<T[K]>;
};

export type PatchUpdate<T> = { id: string } & NestedPartial<T>;
