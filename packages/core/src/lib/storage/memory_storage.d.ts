/// <reference types="node" />
import 'reflect-metadata';
import { ICollection, IDocument, IFirestoreTransaction, IStorageDriver, Operator, OrderDirection, QueryBuilder, SaveOptions } from "./storage";
export declare class MemoryStorage implements IStorageDriver {
    data: Document;
    findById(collection: string, id: string): Promise<any>;
    find<T>(collection: string, cb: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<any>;
    save(collection: string, data: any, options?: SaveOptions): Promise<any>;
    addDocument(collection: string, id: string, data: any, options?: SaveOptions): void;
    query<T>(collection: string, cb?: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<any[]>;
    batchGet(collection: string, ids: string[]): Promise<any[]>;
    clear(collection: string): Promise<void>;
    delete(collection: string, id: string): Promise<void>;
    transaction<T>(updateFunction: (transaction: IFirestoreTransaction) => Promise<T>, transactionOptions?: {
        maxAttempts?: number;
    }): Promise<T>;
    generateId(): string;
    import(data: IDocument): Promise<void>;
    setData(data: IDocument): Promise<void>;
    private getAsArray;
    private static mapWithId;
    static clone(data: any): {
        id: string;
        data: any;
    };
    private static checkForUndefined;
    export(base: string): any;
    stream<T = any>(collection: string, query?: (qb: QueryBuilder<T>) => QueryBuilder<T>): NodeJS.ReadableStream;
    groupQuery<T>(collectionId: string, cb?: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<T[]>;
    loopOverCollections(collectionMap: CollectionMap, cb: (name: string, documents: DocumentMap) => void): void;
}
export declare class MemoryQueryBuilder<T> implements QueryBuilder<T> {
    private data;
    private offsetNumber;
    private limitNumber;
    private clauses;
    private ordering;
    constructor(data: any[]);
    where(field: string, operator: Operator, value: any): MemoryQueryBuilder<T>;
    get(): Promise<any[]>;
    orderBy(property: string, direction?: OrderDirection): this;
    limit(limit: number): QueryBuilder<T>;
    offset(offset: number): QueryBuilder<T>;
    onSnapshot(onNext: (snapshot: any) => void, onError?: (error: Error) => void): () => void;
    stream(): NodeJS.ReadableStream;
}
export declare class MemoryTransaction implements IFirestoreTransaction {
    private storage;
    private didWrite;
    constructor(storage: MemoryStorage);
    create<T>(collectionPath: string, data: T): IFirestoreTransaction;
    delete(collectionPath: string, docId: string): IFirestoreTransaction;
    get<T>(collectionPath: string, docId: string): Promise<T>;
    query<T>(collectionPath: string, cb: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<T[]>;
    set<T>(collectionPath: string, data: T): IFirestoreTransaction;
    setAvoidMerge<T>(collectionPath: string, data: T): IFirestoreTransaction;
    update<T>(collectionPath: string, data: T): IFirestoreTransaction;
    private static getReadAfterWriteError;
}
interface DocumentMap {
    [id: string]: Document;
}
export declare class Collection {
    documents: DocumentMap;
    constructor(collection?: ICollection);
    getDocument(path: string, avoidDocumentCreation?: boolean): any;
    private getOrCreateDocument;
    clear(): void;
    toJson(): ICollection;
}
interface CollectionMap {
    [name: string]: Collection;
}
export declare class Document {
    collections: CollectionMap;
    createdAt: Date;
    updatedAt: Date;
    data: any;
    constructor(data?: IDocument);
    private getOrCreateCollection;
    getCollection(path: any): Collection;
    toJson(): IDocument;
    static parseData(data: any): any;
    private static isTimestamp;
    private static formatData;
}
export {};
//# sourceMappingURL=memory_storage.d.ts.map