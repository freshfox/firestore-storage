declare const t: unique symbol;
export type Id<T> = string & { readonly [t]: T };

export interface BaseModel {
	id: string;
	_rawPath: string;
}

type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
};
type NonFunctionProperties<T> = Pick<T, keyof NonFunctionPropertyNames<T>>;

type Clonable<T> = {
	[K in keyof NonFunctionProperties<T>]: T[K] extends object ? Clonable<T[K]> : T[K];
};

export type ModelDataOnly<T> = Omit<T, keyof BaseModel>;

export type ModelDataWithId<T extends BaseModel> = Pick<T, 'id'> & ModelDataOnly<T>;

export type ModelQuery<T extends BaseModel> = Partial<ModelDataOnly<T>>;

export type PatchUpdate<T extends { id: string }> = Required<Pick<T, 'id'>> & Omit<Partial<T>, 'id'>;
