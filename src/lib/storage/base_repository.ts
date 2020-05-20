import {inject, injectable} from 'inversify';
import {QueryBuilder, IStorageDriver, Storage, ErrorFactory, IErrorFactory, IFirestoreTransaction} from './storage';
import {BaseModel, PatchUpdate} from './base_model';
import {IdTuple, PathFunction} from "./collection_utils";

@injectable()
export abstract class BaseRepository<T extends BaseModel, NumOfIds extends number> {

	constructor(@inject(Storage) protected storage: IStorageDriver,
				@inject(ErrorFactory) protected errorFactory: IErrorFactory) {}

	abstract getCollectionPath(): PathFunction<NumOfIds>;

	findById(...ids: IdTuple<NumOfIds>): Promise<T> {
		const docId = ids.pop();
		return this.storage.findById(this.getPath(...ids), docId);
	}

	find(attributes: Partial<T>, ...ids: IdTuple<NumOfIds>): Promise<T> {
		return this.storage.find(this.getPath(...ids), (qb) => {
			return this.mapToWhereClause(qb, attributes);
		})
	}

	async get(attributes: Partial<T>, ...ids: IdTuple<NumOfIds>) {
		const doc = await this.find(attributes, ...ids as any);
		if (doc) {
			return doc;
		}
		throw this.createError(attributes, ids);
	}

	async getById(...ids: IdTuple<NumOfIds>) {
		const doc = await this.findById(...ids as any);
		if (doc) {
			return doc;
		}
		throw this.createError({id: ids.pop()} as any, ids);
	}

	list(attributes?: Partial<T>, ...ids: IdTuple<NumOfIds>): Promise<T[]> {
		return this.query((qb) => {
			return this.mapToWhereClause(qb, attributes);
		}, ...ids as any);
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

	query(cb: (qb: QueryBuilder<T>) => QueryBuilder<T>, ...ids: IdTuple<NumOfIds>): Promise<T[]> {
		return this.storage.query(this.getPath(...ids), cb);
	}

	batchGet(documentIds: string[], ...ids: IdTuple<NumOfIds>): Promise<T[]> {
		return this.storage.batchGet(this.getPath(...ids), documentIds);
	}

	async batchGetNoNulls(documentIds: string[], ...ids: IdTuple<NumOfIds>) {
		const docs = await this.batchGet(documentIds, ...ids as any);
		return docs.filter(d => d);
	}

	save(data: T | PatchUpdate<T>, ...ids: IdTuple<NumOfIds>): Promise<T> {
		return this.storage.save<any>(this.getPath(...ids), data)
	}

	write(data: T | PatchUpdate<T>, ...ids: IdTuple<NumOfIds>) {
		return this.storage.save(this.getPath(...ids), data, {avoidMerge: true});
	}

	clear(...ids: IdTuple<NumOfIds>): Promise<void> {
		return this.storage.clear(this.getPath(...ids))
	}

	delete(...ids: IdTuple<NumOfIds>): Promise<void> {
		const docId = ids.pop();
		return this.storage.delete(this.getPath(...ids), docId);
	}

	listen(cb: (qb: QueryBuilder<T>) => QueryBuilder<T>, onNext, onError, ...ids: IdTuple<NumOfIds>) {
		return this.storage.listen(this.getPath(...ids), cb, onNext, onError);
	}

	transaction<R>(updateFunction: RepositoryTransactionCallback<T, R>, ...ids: IdTuple<NumOfIds>): Promise<R> {
		return this.storage.transaction<R>((trx) => {
			return updateFunction(new RepositoryTransaction(this.getPath(...ids), trx))
		});
	}

	generateId() {
		return this.storage.generateId();
	}

	private createError(attributes: Partial<T>, ids: string[]) {
			const id = attributes.id ? ` (${attributes.id})` : '';
			return this.errorFactory(`Unable to get document${id} from ${this.getPath(...ids)}`);
	}

	private getPath(...ids: any) {
		const pathFunc = this.getCollectionPath();
		return pathFunc(...ids);
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
