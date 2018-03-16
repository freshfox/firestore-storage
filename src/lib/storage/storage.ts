export interface IStorageDriver {

	findById(collection: string, id: string): Promise<any>;

	find(collection: string, query: (qb: QueryBuilder) => QueryBuilder): Promise<any>;

	save(collection: string, data): Promise<any>;

	query(collection: string, query: (qb: QueryBuilder) => QueryBuilder): Promise<any>;

	batchGet(collection: string, ids: string[]): Promise<any>;

	delete(collection: string, id: string): Promise<void>;

	clear(collection: string): Promise<any>;

	listen(collection: string, cb: (qb: QueryBuilder) => QueryBuilder,
		   onNext: (snapshot: any) => void, onError?: (error: Error) => void): () => void;
}

export interface QueryBuilder {

	where(field: string, operator: string, value: any): QueryBuilder

	limit(limit: number): QueryBuilder;

	offset(offset: number): QueryBuilder;

	orderBy(property: string, direction?: OrderDirection): QueryBuilder;

	get(): Promise<any>;

	onSnapshot(onNext: (snapshot: any) => void, onError?: (error: Error) => void) : () => void;

}

export type OrderDirection = 'desc' | 'asc';

export const Storage = Symbol('Storage');
export const FirestoreInstance = Symbol('FirestoreInstance');




