import {
	Exclude,
	plainToInstance,
	ClassConstructor,
	Transform,
	Type,
	plainToClassFromExist,
	instanceToPlain,
} from 'class-transformer';
import { BaseModel, ModelDataOnly, ModelDataWithId, PatchUpdate } from './types';

export interface ModelMetaInternal {
	id?: string;
	rawPath?: string;
}

export type ModelMeta<R extends boolean = false> = R extends true ? Required<ModelMetaInternal> : ModelMetaInternal;

export class BaseModelClass<T extends BaseModel> implements BaseModel, ModelMeta {
	@Exclude()
	private readonly __metadata?: ModelMeta;

	constructor(data: PatchUpdate<ModelDataWithId<T>> | ModelDataOnly<T>, meta?: ModelMeta) {
		this.__metadata = Object.assign({}, meta || {});
		plainToClassFromExist(this, data);
	}

	get id() {
		return this.__metadata?.id;
	}

	set id(id: string) {
		this.__metadata.id = id;
	}

	get _rawPath() {
		return this.__metadata.rawPath;
	}

	getData(): ModelDataOnly<T> {
		return instanceToPlain(this) as any;
	}
}

export function serialize<T, V>(cls: ClassConstructor<T>, plain: V) {
	return plainToInstance(cls, plain);
}

export function DateTransformer(): (target: object, key: string) => void {
	return (target, key) => {
		Transform((args) => {
			const val = args.obj[args.key];
			if (val) {
				if (typeof val.toDate === 'function') {
					return val.toDate();
				} else {
					return new Date(val);
				}
			}
			return null;
		})(target, key);
		Type(() => Date)(target, key);
	};
}
