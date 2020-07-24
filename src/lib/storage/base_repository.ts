import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {QueryBuilder, IStorageDriver, Storage, ErrorFactory, IErrorFactory, IFirestoreTransaction} from './storage';
import {BaseModel, PatchUpdate} from './base_model';

@injectable()
export abstract class BaseRepository<T extends BaseModel> {

	constructor(@inject(Storage) protected storage: IStorageDriver,
				@inject(ErrorFactory) protected errorFactory: IErrorFactory) {}

	abstract getCollectionPath(...documentIds: string[]): string;

	findById(...ids: string[]): Promise<T> {
		const docId = ids.pop();
		return this.storage.findById(this.getCollectionPath(...ids), docId);
	}

	find(attributes: Partial<T>, ...ids: string[]): Promise<T> {
		return this.storage.find(this.getCollectionPath(...ids), (qb) => {
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

	list(attributes?: Partial<T>, ...ids: string[]): Promise<T[]> {
		return this.query((qb) => {
			return this.mapToWhereClause(qb, attributes);
		}, ...ids);
	}

	protected mapToWhereClause(query: QueryBuilder<T>, attributes?: Partial<T>): QueryBuilder<T> {
		if (!attributes) {
			return query;
		}
		return Object.keys(attributes)
			.reduce((query, key) => {
				return query.where(key, '==', attributes[key])
			}, query);
	}

	query(cb: (qb: QueryBuilder<T>) => QueryBuilder<T>, ...ids: string[]): Promise<T[]> {
		return this.storage.query(this.getCollectionPath(...ids), cb);
	}

	batchGet(documentIds: string[], ...ids: string[]): Promise<T[]> {
		return this.storage.batchGet(this.getCollectionPath(...ids), documentIds);
	}

	async batchGetNoNulls(documentIds: string[], ...ids: string[]) {
		const docs = await this.batchGet(documentIds, ...ids);
		return docs.filter(d => d);
	}

	save(data: T | PatchUpdate<T>, ...ids: string[]): Promise<T> {
		return this.storage.save<any>(this.getCollectionPath(...ids), data)
	}

	write(data: T | PatchUpdate<T>, ...ids: string[]) {
		return this.storage.save(this.getCollectionPath(...ids), data, {avoidMerge: true});
	}

	clear(...ids: string[]): Promise<void> {
		return this.storage.clear(this.getCollectionPath(...ids))
	}

	delete(...ids: string[]): Promise<void> {
		const docId = ids.pop();
		return this.storage.delete(this.getCollectionPath(...ids), docId);
	}

	transaction<R>(updateFunction: RepositoryTransactionCallback<T, R>, ...ids: string[]): Promise<R> {
		return this.storage.transaction<R>((trx) => {
			return updateFunction(new RepositoryTransaction(this.getCollectionPath(...ids), trx))
		});
	}

	generateId() {
		return this.storage.generateId();
	}

	private createError(attributes: Partial<T>, ids: string[]) {
			const id = attributes.id ? ` (${attributes.id})` : '';
			return this.errorFactory(`Unable to get document${id} from ${this.getCollectionPath(...ids)}`);
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
