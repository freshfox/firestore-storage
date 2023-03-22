import { extractPathParam, KeyOf } from './path';

export class IndexManager {
	indexes: IIndexEntry[] = [];
	fieldOverrides: IFieldOverride[] = [];

	addIndex<T = any>(collectionGroup: string, queryScope: QueryScope) {
		return new IndexBuilder<T>(this, collectionGroup, queryScope);
	}

	addOverride<T = any>(collectionGroup: string, fieldPath: KeyOf<T>) {
		return new FieldOverrideBuilder(this, collectionGroup, fieldPath);
	}

	toObject(): IFirestoreIndex {
		return {
			indexes: this.indexes,
			fieldOverrides: this.fieldOverrides,
		};
	}

	toJSON(space?: string | number) {
		return JSON.stringify(this.toObject(), null, space);
	}
}

class IndexBuilder<T> {
	readonly entry: IIndexEntry;

	constructor(private parent: IndexManager, collectionGroup: string, queryScope: QueryScope) {
		this.entry = {
			collectionGroup,
			queryScope,
			fields: [],
		};
	}

	field(fieldPath: KeyOf<T>, order?: IndexFieldOrder) {
		this.entry.fields.push({
			fieldPath: extractPathParam(fieldPath),
			order: order || IndexFieldOrder.Asc,
		});
		return this;
	}

	arrayField(fieldPath: KeyOf<T>, config: FieldArrayConfig) {
		this.entry.fields.push({
			fieldPath: extractPathParam(fieldPath),
			arrayConfig: config,
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
			collectionGroup: collectionGroup,
			fieldPath: extractPathParam(fieldPath),
			indexes: [],
		};
	}

	order(queryScope: QueryScope, order: IndexFieldOrder) {
		this.entry.indexes.push({ queryScope, order });
		return this;
	}

	array(queryScope: QueryScope, arrayConfig: FieldArrayConfig) {
		this.entry.indexes.push({ queryScope, arrayConfig });
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

export interface IIndexEntry {
	collectionGroup: string;
	queryScope: QueryScope;
	fields: IIndexField[];
}

export type IIndexField = {
	fieldPath: string;
	order?: IndexFieldOrder;
} & {
	fieldPath: string;
	arrayConfig?: FieldArrayConfig;
};

export interface IFieldOverride<T = any> {
	collectionGroup: string;
	fieldPath: string;
	indexes: IFieldOverrideIndex[];
}

export type IFieldOverrideIndex =
	| {
			queryScope: QueryScope;
			order?: IndexFieldOrder;
	  }
	| {
			queryScope: QueryScope;
			arrayConfig?: FieldArrayConfig;
	  };

export enum IndexFieldOrder {
	Asc = 'ASCENDING',
	Desc = 'DESCENDING',
}

export enum FieldArrayConfig {
	Contains = 'CONTAINS',
}

export enum QueryScope {
	Collection = 'COLLECTION',
	CollectionGroup = 'COLLECTION_GROUP',
}
