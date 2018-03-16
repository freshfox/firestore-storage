export interface BaseModel {
	id?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
export interface ReferenceMap {
	[id: string]: boolean;
}
export declare function toReferenceMap(...entities: BaseModel[]): ReferenceMap;
