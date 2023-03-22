declare const t: unique symbol;
export type Id<T> = string & { readonly [t]: T };

export interface BaseModel {
	id?: string;
	createdAt?: Date;
	updatedAt?: Date;
	_rawPath?: string;
}

export type ModelQuery<T extends BaseModel> = Partial<Omit<T, keyof BaseModel>>;

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
