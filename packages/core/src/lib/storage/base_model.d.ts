export interface BaseModel {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ReferenceMap {
    [id: string]: boolean;
}
export declare function toReferenceMap(...entities: BaseModel[]): ReferenceMap;
export declare function toReferenceMapFromIds(ids: string[], value?: any): ReferenceMap;
export declare function isSameReferenceMap(r1: ReferenceMap, r2: ReferenceMap): boolean;
export declare type PatchUpdate<T> = {
    id: string;
} & Partial<T>;
//# sourceMappingURL=base_model.d.ts.map