export class IndexManager {

	indexes: IIndexEntry[] = [];
	fieldOverrides: IFieldOverride[] = [];

	addIndex<T>(collectionGroup: string, queryScope: QueryScope) {
		return new IndexBuilder<T>(this, collectionGroup, queryScope);
	}

	addOverride<T>(collectionGroup: string, fieldPath: KeyOf<T>) {
		return new FieldOverrideBuilder(this, collectionGroup, fieldPath);
	}

	toObject(): IFirestoreIndex {
		return {
			indexes: this.indexes,
			fieldOverrides: this.fieldOverrides
		}
	}

	toJSON(space?: string | number) {
		return JSON.stringify(this.toObject(), null, space);
	}
}

class IndexBuilder<T> {

	readonly entry: IIndexEntry<T>;

	constructor(private parent: IndexManager, collectionGroup: string, queryScope: QueryScope) {
		this.entry = {
			collectionGroup,
			queryScope,
			fields: []
		};
	}

	field(fieldPath: keyof T | string, order?: IndexFieldOrder) {
		this.entry.fields.push({
			fieldPath: fieldPath,
			order: order || IndexFieldOrder.Asc
		});
		return this;
	}

	arrayField(fieldPath: keyof T | string, config: FieldArrayConfig) {
		this.entry.fields.push({
			fieldPath: fieldPath,
			arrayConfig: config
		});
		return this;
	}

	add() {
		if (this.entry.fields.length < 2) {
			throw new Error(`Not enough fields provided to create an index for ${this.entry.collectionGroup}`);
		}
		this.parent.indexes.push(this.entry);
		return this.parent;
	}

}

class FieldOverrideBuilder<T> {

	private readonly entry: IFieldOverride<T>;

	constructor(private parent: IndexManager, collectionGroup: string, fieldPath: KeyOf<T>) {
		this.entry = {
			collectionGroup, fieldPath,
			indexes: []
		}
	}

	order(queryScope: QueryScope, order: IndexFieldOrder) {
		this.entry.indexes.push({queryScope, order});
		return this;
	}

	array(queryScope: QueryScope, arrayConfig: FieldArrayConfig) {
		this.entry.indexes.push({queryScope, arrayConfig})
		return this;
	}

	add() {
		this.parent.fieldOverrides.push(this.entry);
		return this.parent;
	}

}

export interface IFirestoreIndex {
	indexes: IIndexEntry[];
	fieldOverrides: IFieldOverride[];
}

export interface IIndexEntry<T = any> {
	collectionGroup: string;
	queryScope: QueryScope;
	fields: IIndexField<T>[];
}

export type IIndexField<T> = {
	fieldPath: KeyOf<T>
	order?: IndexFieldOrder;
} & {
	fieldPath: KeyOf<T>;
	arrayConfig?: FieldArrayConfig;
}

export interface IFieldOverride<T = any> {
	collectionGroup: string;
	fieldPath: KeyOf<T>;
	indexes: IFieldOverrideIndex[];
}

export type IFieldOverrideIndex = {
	queryScope: QueryScope;
	order?: IndexFieldOrder;
} | {
	queryScope: QueryScope;
	arrayConfig?: FieldArrayConfig;
}

// TODO update to support nested object paths
type KeyOf<T> = keyof T | string;

export enum IndexFieldOrder {
	Asc = 'ASCENDING',
	Desc = 'DESCENDING',
}

export enum FieldArrayConfig {
	Contains = 'CONTAINS'
}

export enum QueryScope {
	Collection = 'COLLECTION',
	CollectionGroup = 'COLLECTION_GROUP'
}
