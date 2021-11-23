import 'reflect-metadata';
import {inject, injectable} from 'inversify';
import {
	BaseModel,
	IDocumentTransformer,
	IFirestoreTransaction,
	IStorageDriver,
	ModelQuery,
	PatchUpdate,
	PathFunction,
	QueryBuilder,
	ReadModel,
	StorageDriver,
	StreamOptions, TransformerRepository
} from "firestore-storage-core";
import {Inject, Injectable} from "@nestjs/common";
import {FirestoreStorageError} from "firestore-storage-core/dist/lib/storage/error";

@injectable()
@Injectable()
export abstract class BaseRepository<T extends BaseModel> extends TransformerRepository<T> {

	constructor(@inject(StorageDriver)
				@Inject(StorageDriver)
				protected storage: IStorageDriver) {
		super();
	}

	abstract getCollectionPath(...documentIds: string[]): string | PathFunction;

	findById(...ids: string[]): Promise<ReadModel<T> | null> {
		const docId = ids.pop();
		return this.storage.findById(this.getStringCollectionPath(...ids), docId, {
			transformer: this.transformer
		});
	}

	find(attributes: ModelQuery<T>, ...ids: string[]): Promise<ReadModel<T> | null> {
		return this.storage.find(this.getStringCollectionPath(...ids), (qb) => {
			return this.mapToWhereClause(qb, attributes);
		}, {
			transformer: this.transformer
		})
	}

	async get(attributes: ModelQuery<T>, ...ids: string[]): Promise<ReadModel<T>> {
		const doc = await this.find(attributes, ...ids);
		if (doc) {
			return doc;
		}
		throw this.createError(attributes as any, ids);
	}

	async getById(...ids: string[]): Promise<ReadModel<T>> {
		const doc = await this.findById(...ids);
		if (doc) {
			return doc;
		}
		throw this.createError({id: ids.pop()} as any, ids);
	}

	list(attributes?: ModelQuery<T> | null, ...ids: string[]): Promise<ReadModel<T>[]> {
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

	query(cb: (qb: QueryBuilder<T>) => QueryBuilder<T>, ...ids: string[]): Promise<ReadModel<T>[]> {
		return this.storage.query<ReadModel<T>>(this.getStringCollectionPath(...ids), cb, {
			transformer: this.transformer
		});
	}

	groupQuery(cb?: (qb: QueryBuilder<T>) => QueryBuilder<T>): Promise<ReadModel<T>[]> {
		let collectionId = this.getCollectionId();
		return this.storage.groupQuery<ReadModel<T>>(collectionId, cb, {
			transformer: this.transformer
		});
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

	async findAll(documentIds: string[], ...ids: string[]): Promise<(ReadModel<T> | null)[]> {
		return this.storage.batchGet(this.getStringCollectionPath(...ids), documentIds, {
			transformer: this.transformer
		});
	}

	async getAll(documentIds: string[], ...ids: string[]): Promise<ReadModel<T>[]> {
		const all = await this.findAll(documentIds, ...ids);
		for (const id of documentIds) {
			const doc = all.find(d => d?.id === id);
			if (!doc) {
				throw this.createError({id: id} as T, ids);
			}
		}
		return all;
	}

	save(data: T | PatchUpdate<T>, ...ids: string[]): Promise<ReadModel<T>> {
		return this.storage.save<any>(this.getStringCollectionPath(...ids), data, {
			transformer: this.transformer
		})
	}

	write(data: T | PatchUpdate<T>, ...ids: string[]): Promise<ReadModel<T>> {
		return this.storage.save<any>(this.getStringCollectionPath(...ids), data, {
			avoidMerge: true,
			transformer: this.transformer
		});
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
		}, {
			transformer: this.transformer
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
		return new FirestoreStorageError(attributes, this.getStringCollectionPath(...ids));
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
