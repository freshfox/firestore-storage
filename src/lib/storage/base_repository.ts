import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {
	QueryBuilder,
	IStorageDriver,
	Storage,
	ErrorFactory,
	IErrorFactory,
	IFirestoreTransaction,
	StreamOptions
} from './storage';
import {BaseModel, PatchUpdate} from './base_model';
import {PathFunction} from "./collection_utils";

type ModelQuery<T extends BaseModel> = Partial<Omit<T, keyof BaseModel>>;

@injectable()
export abstract class BaseRepository<T extends BaseModel> {

	constructor(@inject(Storage) protected storage: IStorageDriver,
				@inject(ErrorFactory) protected errorFactory: IErrorFactory) {}

	abstract getCollectionPath(...documentIds: string[]): string | PathFunction;

	findById(...ids: string[]): Promise<T> {
		const docId = ids.pop();
		return this.storage.findById(this.getStringCollectionPath(...ids), docId);
	}

	find(attributes: ModelQuery<T>, ...ids: string[]): Promise<T> {
		return this.storage.find(this.getStringCollectionPath(...ids), (qb) => {
			return this.mapToWhereClause(qb, attributes);
		})
	}

	async get(attributes: Partial<T>, ...ids: string[]) {
		const doc = await this.find(attributes, ...ids);
		if (doc) {
			return doc;
		}
		throw this.createError(attributes, ids);
	}

	async getById(...ids: string[]) {
		const doc = await this.findById(...ids);
		if (doc) {
			return doc;
		}
		throw this.createError({id: ids.pop()} as any, ids);
	}

	list(attributes?: ModelQuery<T>, ...ids: string[]): Promise<T[]> {
		return this.query((qb) => {
			return this.mapToWhereClause(qb, attributes);
		}, ...ids);
	}

	protected mapToWhereClause(query: QueryBuilder<T>, attributes?: ModelQuery<T>): QueryBuilder<T> {
		if (!attributes) {
			return query;
		}
		return Object.keys(attributes)
			.reduce((query, key) => {
				return query.where(key, '==', attributes[key])
			}, query);
	}

	query(cb: (qb: QueryBuilder<T>) => QueryBuilder<T>, ...ids: string[]): Promise<T[]> {
		return this.storage.query(this.getStringCollectionPath(...ids), cb);
	}

	groupQuery(cb?: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<T[]> {
		let collectionId = this.getCollectionId();
		return this.storage.groupQuery(collectionId, cb);
	}

	private getCollectionId(): string {
		try {
			const path = this.getCollectionPath();
			if (path instanceof Function) {
				return path.collectionGroup;
			}
		} catch (err) {}
		throw new Error('Unable to get collection id, getCollectionPath() must return a PathFunction')
	}

	stream(cb?: (qb: QueryBuilder<T>) => QueryBuilder<T>, ...ids: string[])
	stream(cb?: (qb: QueryBuilder<T>) => QueryBuilder<T>, options?: StreamOptions, ...ids: string[])
	stream(cb?: (qb: QueryBuilder<T>) => QueryBuilder<T>, optionsOrId?: StreamOptions|string, ...ids: string[]) {
		const pathIds: string[] = ids || [];
		if (typeof optionsOrId === 'string') {
			pathIds.unshift(optionsOrId);
			optionsOrId = null;
		}
		return this.storage.stream<T>(this.getStringCollectionPath(...pathIds), cb, optionsOrId as StreamOptions);
	}

	batchGet(documentIds: string[], ...ids: string[]): Promise<T[]> {
		return this.storage.batchGet(this.getStringCollectionPath(...ids), documentIds);
	}

	async batchGetNoNulls(documentIds: string[], ...ids: string[]) {
		const docs = await this.batchGet(documentIds, ...ids);
		return docs.filter(d => d);
	}

	save(data: T | PatchUpdate<T>, ...ids: string[]): Promise<T> {
		return this.storage.save<any>(this.getStringCollectionPath(...ids), data)
	}

	write(data: T | PatchUpdate<T>, ...ids: string[]) {
		return this.storage.save(this.getStringCollectionPath(...ids), data, {avoidMerge: true});
	}

	clear(...ids: string[]): Promise<void> {
		return this.storage.clear(this.getStringCollectionPath(...ids))
	}

	delete(...ids: string[]): Promise<void> {
		const docId = ids.pop();
		return this.storage.delete(this.getStringCollectionPath(...ids), docId);
	}

	transaction<R>(updateFunction: RepositoryTransactionCallback<T, R>, ...ids: string[]): Promise<R> {
		return this.storage.transaction<R>((trx) => {
			return updateFunction(new RepositoryTransaction(this.getStringCollectionPath(...ids), trx))
		});
	}

	generateId() {
		return this.storage.generateId();
	}

	private getStringCollectionPath(...docIds: string[]) {
		const path = this.getCollectionPath(...docIds);
		if (typeof path === 'string') {
			return path;
		}
		return path(...docIds);
	}

	private createError(attributes: Partial<T>, ids: string[]) {
			const id = attributes.id ? ` (${attributes.id})` : '';
			return this.errorFactory(`Unable to get document${id} from ${this.getStringCollectionPath(...ids)}`);
	}

}

export type RepositoryTransactionCallback<T, R> = (transaction: RepositoryTransaction<T>) => Promise<R>

export class RepositoryTransaction<T> {

	constructor(private collectionPath: string,
				private trx: IFirestoreTransaction) {
	}

	create(data: T): IFirestoreTransaction {
		return this.trx.create(this.collectionPath, data);
	}

	delete(docId: string): IFirestoreTransaction {
		return this.trx.delete(this.collectionPath, docId);
	}

	get(docId: string): Promise<T> {
		return this.trx.get(this.collectionPath, docId);
	}

	query(cb: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<T[]> {
		return this.trx.query(this.collectionPath, cb);
	}

	set(data: T): IFirestoreTransaction {
		return this.trx.set(this.collectionPath, data);
	}

	setAvoidMerge(data: T): IFirestoreTransaction {
		return this.trx.setAvoidMerge(this.collectionPath, data);
	}

	update(data: T): IFirestoreTransaction {
		return this.trx.update(this.collectionPath, data);
	}

}
