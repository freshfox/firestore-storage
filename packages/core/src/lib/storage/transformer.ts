import { BaseModelClass, ModelMeta } from './model';
import { cloneDeep } from 'lodash';
import { BaseModel, ModelDataOnly, ModelDataWithId, PatchUpdate } from './types';

export interface IDocumentTransformer<T extends BaseModel> {
	fromFirestoreToObject(data: ModelDataOnly<T>, meta: ModelMeta): T;

	toFirestoreDocument(doc: T): { id: string; data: ModelDataOnly<T> };
	toFirestoreDocument(doc: ModelDataOnly<T> | PatchUpdate<ModelDataWithId<T>>): {
		id: undefined;
		data: ModelDataOnly<T>;
	};
	toFirestoreDocument(doc: T | ModelDataOnly<T> | PatchUpdate<ModelDataWithId<T>>): {
		id?: string;
		data: ModelDataOnly<T>;
	};
}

export class ModelClassTransformer<T extends BaseModelClass<T>> implements IDocumentTransformer<T> {
	constructor(private TypeClass: new (...args: any[]) => T) {}

	fromFirestoreToObject(data, meta) {
		return new this.TypeClass(data, meta);
	}

	toFirestoreDocument(doc) {
		if (doc instanceof BaseModelClass) {
			return {
				id: doc.id,
				data: doc.getData(),
			};
		}
		return DEFAULT_DOCUMENT_TRANSFORMER.toFirestoreDocument(doc) as any;
	}
}

export const DEFAULT_DOCUMENT_TRANSFORMER: IDocumentTransformer<BaseModel> = {
	fromFirestoreToObject(data, meta) {
		const base: BaseModel = {
			id: meta.id,
			_rawPath: meta.rawPath,
		};
		return Object.assign({}, data, base);
	},
	toFirestoreDocument(doc) {
		const clone = cloneDeep(doc);
		delete clone.id;
		delete clone.createdAt;
		delete clone.updatedAt;

		return {
			id: doc.id,
			data: clone,
		};
	},
};
