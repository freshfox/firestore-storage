export declare class IndexManager {
    indexes: IIndexEntry[];
    addIndex<T>(collectionGroup: string, queryScope: QueryScope): IndexBuilder<T>;
    toObject(): IFirestoreIndex;
    toJSON(space?: string | number): string;
}
declare class IndexBuilder<T> {
    private parent;
    readonly entry: IIndexEntry<T>;
    constructor(parent: IndexManager, collectionGroup: string, queryScope: QueryScope);
    field(fieldPath: keyof T | string, order?: IndexFieldOrder): this;
    add(): IndexManager;
}
export interface IFirestoreIndex {
    indexes: IIndexEntry[];
}
export interface IIndexEntry<T = any> {
    collectionGroup: string;
    queryScope: QueryScope;
    fields: IIndexField<T>[];
}
export interface IIndexField<T> {
    fieldPath: keyof T | string;
    order?: IndexFieldOrder;
}
export declare enum IndexFieldOrder {
    Asc = "ASCENDING",
    Desc = "DESCENDING"
}
export declare enum QueryScope {
    Collection = "COLLECTION",
    CollectionGroup = "COLLECTION_GROUP"
}
export {};
//# sourceMappingURL=index_manger.d.ts.map