export interface IStorageDriver {

	findById<T = any>(collection: string, id: string): Promise<T>;

	find<T = any>(collection: string, query: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<T>;

	save<T = any>(collection: string, data: T, options?: SaveOptions): Promise<T>;

	query<T = any>(collection: string, query?: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<T[]>;

	groupQuery<T>(collectionId: string, cb?: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<T[]>

	stream<T = any>(collection: string, query?: (qb: QueryBuilder<T>) => QueryBuilder<T>, options?: StreamOptions): NodeJS.ReadableStream;

	batchGet<T = any>(collection: string, ids: string[]): Promise<T[]>;

	delete(collection: string, id: string): Promise<void>;

	clear(collection: string): Promise<any>;

	transaction<T = any>(updateFunction: (transaction: IFirestoreTransaction) => Promise<T>,
				   transactionOptions?:{maxAttempts?: number}): Promise<T>;

	generateId(): string;

	export(base?: string): Promise<IDocument>;

	import(data: IDocument): Promise<void>

}

export interface QueryBuilder<T> {
	where(field: string, operator: Operator, value: any): QueryBuilder<T>

	orderBy(property: string, direction?: OrderDirection): QueryBuilder<T>;

	get(): Promise<any>;

	onSnapshot(onNext: (snapshot: any) => void, onError?: (error: Error) => void) : () => void;

	stream(): NodeJS.ReadableStream;

	limit(limit: number): QueryBuilder<T>;

	offset(offset: number): QueryBuilder<T>;
}

export interface IFirestoreTransaction {

	query<T>(collectionPath: string, cb: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<T[]>;

	get<T>(collectionPath: string, docId: string): Promise<T>;

	create<T>(collectionPath: string, data: T): IFirestoreTransaction;

	set<T>(collectionPath: string, data: T): IFirestoreTransaction;

	setAvoidMerge<T>(collectionPath: string, data: T): IFirestoreTransaction;

	update<T>(collectionPath: string, data: T): IFirestoreTransaction;

	delete(collectionPath: string, docId: string): IFirestoreTransaction;
}

export interface StreamOptions {
	size?: number
}

export type OrderDirection = 'desc' | 'asc';
export type Operator = '==' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains';

export const StorageDriver = Symbol.for('FirestoreStorage.StorageDriver');
export const FirestoreInstance = Symbol.for('FirestoreStorage.FirestoreInstance');
export const ErrorFactory = Symbol.for('FirestoreStorage.ErrorFactory');

export interface SaveOptions {
	avoidMerge?: boolean;
}

export type IErrorFactory = (message: string) => Error;

export interface IDocument {
	collections: {
		[name: string]: ICollection
	};
	createdAt: Date;
	updatedAt: Date;
	data: any;
}

export interface ICollection {
	documents: {
		[id: string]: IDocument
	};
}


