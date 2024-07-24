import { ModelMeta } from './model';
import { cloneDeep } from 'lodash';
import { BaseModel, ModelDataOnly, ModelDataWithId, PatchUpdate } from './types';

export interface IDocumentTransformer<T extends BaseModel> {
	fromFirestoreToObject(data: ModelDataOnly<T>, meta: ModelMeta<true>): T;

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

export const DEFAULT_DOCUMENT_TRANSFORMER: IDocumentTransformer<BaseModel> = {
	fromFirestoreToObject(data, meta) {
		const base: BaseModel = {
			id: meta.id,
			_rawPath: meta.rawPath,
		};
		return Object.assign({}, data, base);
	},
	toFirestoreDocument(doc) {
		const clone = cloneDeep(doc) as any;
		delete clone.id;

		return {
			id: (doc as any)['id'] || undefined,
			data: clone,
		};
	},
};
