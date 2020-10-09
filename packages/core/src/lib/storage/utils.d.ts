declare type AnyKeys<K extends keyof any> = {
    [P in keyof Pick<any, K>]?: string;
};
export declare type ParsedChange<T, K extends keyof any> = {
    before: T;
    after: T;
    ids: AnyKeys<K>;
};
export declare type ParsedSnapshot<T, K extends keyof any> = {
    data: T;
    ids: AnyKeys<K>;
};
export declare class DocumentChange<T, K extends keyof any> {
    private change;
    readonly changedKeys: string[];
    constructor(change: ParsedChange<T, K>);
    get before(): T;
    get after(): T;
    get ids(): AnyKeys<K>;
    hasChanged(...keys: (keyof T)[]): boolean;
    private static eql;
}
export declare function isTimestamp(value: any): any;
export declare function toComparableValue(val: any): any;
export {};
//# sourceMappingURL=utils.d.ts.map