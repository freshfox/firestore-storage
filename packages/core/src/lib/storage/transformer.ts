import {BaseModelClass, ModelDataOnly, ModelMeta} from "./base_model_v2";
import {BaseModel} from "./base_model";
import {cloneDeep} from 'lodash';
import {IBaseRepository} from "./base_repository";

export function RepositoryTransformer<T>(transformer: IDocumentTransformer<T>) {
	return (constructor: IBaseRepository<T>) => {
		constructor.transformer = transformer;
	}
}

export interface IDocumentTransformer<T> {
	fromFirestoreToObject(data: ModelDataOnly<T>, meta: ModelMeta): T;
	toFirestoreDocument(doc: T): {id: string, data: ModelDataOnly<T>};
}

export class ModelClassTransformer<T extends BaseModelClass<T>> implements IDocumentTransformer<T> {

	constructor(private TypeClass: new (...args: any[]) => T) {
	}

	fromFirestoreToObject(data, meta) {
		const type = new this.TypeClass(data);
		type.id = meta.id;
		type.createdAt = meta.createdAt;
		type.updatedAt = meta.updatedAt;
		type.rawPath = meta.rawPath;
		return type;
	}

	toFirestoreDocument(doc) {
		if (doc instanceof BaseModelClass) {
			return {
				id: doc.id,
				data: doc.getData(),
			};
		}
		return DEFAULT_DOCUMENT_TRANSFORMER.toFirestoreDocument(doc) as any
	}

}

export const DEFAULT_DOCUMENT_TRANSFORMER: IDocumentTransformer<BaseModel> = {
	fromFirestoreToObject(data, meta) {
		return Object.assign(<BaseModel>{
			id: meta.id,
			createdAt: meta.createdAt,
			updatedAt: meta.updatedAt,
			_rawPath: meta.rawPath
		}, data);
	},
	toFirestoreDocument(doc) {
		const clone = cloneDeep(doc);
		delete clone.id;
		delete clone.createdAt;
		delete clone.updatedAt;

		return {
			id: doc.id,
			data: clone
		}
	}
}
