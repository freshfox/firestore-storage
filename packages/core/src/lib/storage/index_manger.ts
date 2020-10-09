export class IndexManager {

	indexes: IIndexEntry[] = [];

	addIndex<T>(collectionGroup: string, queryScope: QueryScope) {
		return new IndexBuilder<T>(this, collectionGroup, queryScope);
	}

	toObject(): IFirestoreIndex {
		return {
			indexes: this.indexes
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

	add() {
		if (this.entry.fields.length < 2) {
			throw new Error(`Not enough fields provided to create an index for ${this.entry.collectionGroup}`);
		}
		this.parent.indexes.push(this.entry);
		return this.parent;
	}

}

class FieldBuilder<T> {

	fields: IIndexField<T>[] = [];

	add(fieldPath: keyof T | string, order?: IndexFieldOrder) {
		this.fields.push({
			fieldPath: fieldPath,
			order: order || IndexFieldOrder.Asc
		});
		return this;
	}

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

export enum IndexFieldOrder {
	Asc = 'ASCENDING',
	Desc = 'DESCENDING'
}

export enum QueryScope {
	Collection = 'COLLECTION',
	CollectionGroup = 'COLLECTION_GROUP'
}
