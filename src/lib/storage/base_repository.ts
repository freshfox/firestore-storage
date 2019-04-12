import {inject, injectable} from 'inversify';
import {QueryBuilder, IStorageDriver, Storage, ErrorFactory, IErrorFactory} from './storage';
import {BaseModel} from './base_model';

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

	save(data: T, ...ids: string[]): Promise<T> {
		return this.storage.save(this.getCollectionPath(...ids), data)
	}

	clear(...ids: string[]): Promise<void> {
		return this.storage.clear(this.getCollectionPath(...ids))
	}

	delete(...ids: string[]): Promise<void> {
		const docId = ids.pop();
		return this.storage.delete(this.getCollectionPath(...ids), docId);
	}

	listen(cb: (qb: QueryBuilder<T>) => QueryBuilder<T>, onNext, onError, ...ids: string[]) {
		return this.storage.listen(this.getCollectionPath(...ids), cb, onNext, onError);
	}

	private createError(attributes: Partial<T>, ids: string[]) {
			const id = attributes.id ? ` (${attributes.id})` : '';
			return this.errorFactory(`Unable to get document${id} from ${this.getCollectionPath(...ids)}`);
	}

}
