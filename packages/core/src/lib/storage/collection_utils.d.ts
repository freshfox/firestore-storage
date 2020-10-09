export declare type PathFunction = {
    (...ids: string[]): string;
    path: string;
    collectionGroup: string;
};
export declare class CollectionUtils {
    static createPath(path: string): PathFunction;
    static replacePathSegments(path: String, ...ids: string[]): string;
}
//# sourceMappingURL=collection_utils.d.ts.map