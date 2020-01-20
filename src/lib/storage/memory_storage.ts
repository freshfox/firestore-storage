import {OrderDirection, QueryBuilder, IStorageDriver, SaveOptions, IFirestoreTransaction, Operator} from './storage';
import * as uuid from 'uuid/v4';
import {injectable} from 'inversify';
import * as _ from 'lodash';
import Doc = Mocha.reporters.Doc;

@injectable()
export class MemoryStorage implements IStorageDriver {

	data: Document = new Document();

	findById(collection: string, id: string): Promise<any> {
		const doc = this.data.getCollection(collection).getDocument(id, true);
		if (doc) {
			return Promise.resolve(MemoryStorage.mapWithId(id, doc));
		}
		return Promise.resolve(null);
	}

	async find<T>(collection: string, cb: (qb: QueryBuilder<T>) => QueryBuilder<T>) {
		const items = this.getAsArray(collection);
		const query = cb(new MemoryQueryBuilder(items));
		const result = await query.limit(1).get();
		return result[0] || null;
	}

	save(collection: string, data: any, options?: SaveOptions): Promise<any> {
		const model = MemoryStorage.clone(data);
		const id = model.id ? model.id : this.generateId();
		this.addDocument(collection, id, model.data, options);
		return this.findById(collection, id);
	}

	addDocument(collection: string, id: string, data: any, options?: SaveOptions) {
		const doc = this.data.getCollection(collection).getDocument(id);
		const now = new Date();
		doc.updatedAt = now;
		if (doc.data) {
			if (options && options.avoidMerge) {
				doc.data = {...data};
			} else {
				_.merge(doc.data, data);
			}
		} else {
			doc.createdAt = now;
			doc.data = data;
		}
	}

	query<T>(collection: string, cb: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<any[]> {
		const items = this.getAsArray(collection);
		const query = cb(new MemoryQueryBuilder(items));
		return query.get();
	}

	batchGet(collection: string, ids: string[]) {
		const collectionRef = this.data.getCollection(collection);
		const items = ids.map((id) => {
			const doc = collectionRef.documents[id];
			if (doc) {
				return MemoryStorage.mapWithId(id, doc);
			}
			return null;
		});
		return Promise.resolve(items);
	}

	listen<T>(collection: string, cb: (qb: QueryBuilder<T>) => QueryBuilder<T>, onNext: (snapshot: any) => void, onError?: (error: Error) => void): () => void {
		throw new Error('not supported');
	}

	async clear(collection: string) {
		if (!collection) {
			this.data = new Document();
		} else {
			this.data.getCollection(collection).clear();
		}
	}

	delete(collection: string, id: string) {
		delete this.data.getCollection(collection).documents[id];
		return Promise.resolve();
	}

	transaction<T>(updateFunction: (transaction: IFirestoreTransaction) => Promise<T>,
				   transactionOptions?: { maxAttempts?: number }): Promise<T> {
		return updateFunction(new MemoryTransaction(this));
	}

	generateId(): string {
		return uuid();
	}

	setData(data: IDocument) {
		this.data = new Document(data);
	}

	private getAsArray(collection: string) {
		const collectionRef = this.data.getCollection(collection);
		return Object.keys(collectionRef.documents)
			.map((key) => {
				return MemoryStorage.mapWithId(key, collectionRef.documents[key]);
			});
	}

	private static mapWithId(id: string, doc: Document) {
		return Object.assign({
			id,
			createdAt: doc.createdAt,
			updatedAt: doc.updatedAt
		}, doc.data);
	}

	static clone(data): {id: string, data} {
		try {
			this.checkForUndefined(data);
		} catch (err) {
			console.error(data);
			throw err;
		}
		const clone = Object.assign({}, data);
		const id = data.id;
		delete clone.id;
		delete clone.createdAt;
		delete clone.updatedAt;
		return {
			id: id,
			data: clone
		};
	}

	private static checkForUndefined(data: any) {
		if (Array.isArray(data)) {
			for (const item of data) {
				this.checkForUndefined(item);
			}
		} else if(_.isPlainObject(data)) {
			const keys = Object.keys(data);
			for (const key of keys) {
				this.checkForUndefined(data[key]);
			}
		} else if (data === undefined) {
			throw new Error('Data contains undefined');
		}
	}

	export(base: string): any {
		console.error('Export isn\'t implemented in MemoryStorage');
		return null;
	}

}

export class MemoryQueryBuilder<T> implements QueryBuilder<T> {

	private offsetNumber: number = 0;
	private limitNumber: number;
	private clauses = [];
	private ordering: { property: string, direction?: OrderDirection };

	constructor(private data: any[]) {

	}

	where(field: string, operator: Operator, value: any): MemoryQueryBuilder<T> {
		this.clauses.push(check(field, operator, value));
		return this;
	}

	get() {
		if (!this.data || !this.data.length) {
			return Promise.resolve([]);
		}

		let items = this.data.filter((item) => {
			return this.clauses.reduce((prevValue, current) => {
				return prevValue && current(item);
			}, true)
		});

		if (this.ordering) {
			items.sort((a, b) => {
				const prop = this.ordering.property;
				if (a[prop] === b[prop]) {
					return 0;
				}
				if (this.ordering.direction === 'desc') {
					if (a[prop] > b[prop]) {
						return -1;
					}
					return 1;
				}
				if (a[prop] < b[prop]) {
					return -1;
				}
				return 1;
			})
		}

		if (this.limitNumber) {
			items = items.slice(this.offsetNumber, this.offsetNumber + this.limitNumber);
		} else {
			items = items.slice(this.offsetNumber)
		}

		return Promise.resolve(items);
	}

	orderBy(property: string, direction?: OrderDirection) {
		this.ordering = {
			property, direction
		};
		return this;
	}

	limit(limit: number): QueryBuilder<T> {
		this.limitNumber = limit;
		return this;
	}

	offset(offset: number): QueryBuilder<T> {
		this.offsetNumber = offset;
		return this;
	}

	onSnapshot(onNext: (snapshot: any) => void, onError?: (error: Error) => void): () => void {
		throw new Error('not supported');
	}

}

export class MemoryTransaction implements IFirestoreTransaction {

	private didWrite = false;

	constructor(private storage: MemoryStorage) {

	}

	create<T>(collectionPath: string, data: T): IFirestoreTransaction {
		this.didWrite = true;
		const model = MemoryStorage.clone(data);
		this.storage.addDocument(collectionPath, this.storage.generateId(), model.data);
		return this;
	}

	delete(collectionPath: string, docId: string): IFirestoreTransaction {
		this.didWrite = true;
		delete this.storage.data.getCollection(collectionPath).documents[docId];
		return this;
	}

	get<T>(collectionPath: string, docId: string): Promise<T> {
		if (this.didWrite) {
			throw MemoryTransaction.getReadAfterWriteError();
		}
		return this.storage.findById(collectionPath, docId);
	}

	query<T>(collectionPath: string, cb: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<T[]> {
		if (this.didWrite) {
			throw MemoryTransaction.getReadAfterWriteError();
		}
		return this.storage.query(collectionPath, cb);
	}

	set<T>(collectionPath: string, data: T): IFirestoreTransaction {
		this.didWrite = true;
		const model = MemoryStorage.clone(data);
		const id = model.id ? model.id : this.storage.generateId();
		this.storage.addDocument(collectionPath, id, model.data);
		return this;
	}

	setAvoidMerge<T>(collectionPath: string, data: T): IFirestoreTransaction {
		this.didWrite = true;
		const model = MemoryStorage.clone(data);
		const id = model.id ? model.id : this.storage.generateId();
		this.storage.addDocument(collectionPath, id, model.data, {avoidMerge: true});
		return this;
	}

	update<T>(collectionPath: string, data: T): IFirestoreTransaction {
		this.didWrite = true;
		const model = MemoryStorage.clone(data);
		if (!model.id) {
			throw new Error(`No document id found. Unable to update (${collectionPath}) ${JSON.stringify(model.data, null, 2)}`)
		}
		this.storage.addDocument(collectionPath, model.id, model.data);
		return this;
	}

	private static getReadAfterWriteError() {
		return new Error('Firestore transactions require all reads to be executed before all writes.')
	}


}

const check = (field, operator: Operator, expected) => {
	return (data) => {
		const parts = field.split('.');
		let actual = parts.reduce((obj, key) => {
			if (!obj) {
				return null;
			}
			return obj[key];
		}, data);
		// If actual is falsy and expected is truthy return false
		if ((actual === null || actual === undefined) && expected) {
			return false;
		}
		if (actual instanceof Date) {
			actual = (<Date>actual).getTime();
		}
		if (expected instanceof Date) {
			expected = (<Date>expected).getTime();
		}
		if (operator === '==' && _.isPlainObject(expected)) {
			return _.isEqual(actual, expected);
		}
		switch (operator) {
			case '>': return actual > expected;
			case '>=': return actual >= expected;
			case '<': return actual < expected;
			case '<=': return actual <= expected;
			case '==': return actual === expected;
		}
		throw new Error(`Unsupported operator ${operator}`);
	}
};

export class Collection {

	documents: {
		[id: string]: Document
	} = {};

	constructor(collection?: ICollection) {
		if (collection && collection.documents) {
			this.documents = mapObjects(collection.documents, (doc: IDocument) => {
				return new Document(doc);
			});
		}
	}

	getDocument(path: string, avoidDocumentCreation?: boolean) {
		const index = path.indexOf('/');

		if (index === -1) {
			return this.getOrCreateDocument(path, avoidDocumentCreation);
		}
		const docId = path.substring(0, index);
		const doc = this.getOrCreateDocument(docId);

		const rest = path.substring(index + 1);
		const nameEndIndex = rest.indexOf('/');
		const collectionName = rest.substring(0, nameEndIndex);
		return doc.getCollection(collectionName).getDocument(rest.substring(nameEndIndex + 1));
	}

	private getOrCreateDocument(id: string, avoidDocumentCreation?: boolean): Document {
		if (!this.documents[id]) {
			if (avoidDocumentCreation) {
				return null;
			}
			this.documents[id] = new Document();
		}
		return this.documents[id];
	}

	clear() {
		this.documents = {};
	}

	toJson(): ICollection {
		return {
			documents: mapObjects(this.documents, (doc: Document) => {
				return doc.toJson();
			})
		}
	}

}

export class Document {
	collections: {
		[name: string]: Collection
	} = {};
	createdAt: Date;
	updatedAt: Date;
	data: any;

	constructor(data?: IDocument) {
		if (data) {
			this.data = Document.parseData(data.data);
			this.createdAt = new Date(data.createdAt);
			this.updatedAt = new Date(data.updatedAt);
			if (data.collections) {
				this.collections = mapObjects(data.collections, (collection: ICollection) => {
					return new Collection(collection);
				});
			}
		}
	}

	private getOrCreateCollection(name): Collection {
		if (!this.collections[name]) {
			this.collections[name] = new Collection();
		}
		return this.collections[name];
	}

	getCollection(path): Collection {
		const index = path.indexOf('/');
		if (index === -1) {
			return this.getOrCreateCollection(path);
		}
		const collectionName = path.substring(0, index);
		const collection = this.getOrCreateCollection(collectionName);

		const rest = path.substring(index + 1);
		const idEndIndex = rest.indexOf('/');
		const docId = rest.substring(0, idEndIndex);
		return collection.getDocument(docId).getCollection(rest.substring(idEndIndex + 1));
	}

	toJson(): IDocument {
		let data = null;
		if (this.data) {
			data = mapObjects(this.data, (value) => {
				if (value instanceof Date) {
					value = {
						instance: 'date',
						value: value.toISOString()
					};
				}
				return value;
			})
		}
		return {
			data: Document.formatData(this.data),
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
			collections: mapObjects(this.collections, (collection: Collection) => {
				return collection.toJson();
			})
		};
	}

	private static parseData(data) {
		if (data) {
			return mapObjects(data, (value) => {
				if (_.isPlainObject(value)) {
					if (value.__instance && value.__instance === 'date') {
						return new Date(value.value);
					}
					return this.parseData(value)
				}
				return value;
			});
		}
	}

	private static formatData(data) {
		if (!data) {
			return;
		}
		return mapObjects(data, (value) => {
			if (value instanceof Date) {
				return {
					__instance: 'date',
					value: value.toISOString()
				};
			}
			if (_.isPlainObject(value)) {
				return this.formatData(value)
			}
			return value;
		});
	}
}

function mapObjects(obj: object, mapper: (data) => any) {
	return Object.keys(obj).reduce((result, id) => {
	    result[id] = mapper(obj[id]);
		return result;
	}, {})
}

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
