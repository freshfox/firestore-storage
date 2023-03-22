import {
	Exclude,
	plainToInstance,
	ClassConstructor,
	Transform,
	Type,
	plainToClassFromExist,
	instanceToPlain,
} from 'class-transformer';
import { PatchUpdate } from './types';

type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

type Clonable<T> = {
	[K in keyof NonFunctionProperties<T>]: T[K] extends object ? Clonable<T[K]> : T[K];
};

export interface ModelMetaInternal {
	id?: string;
	createdAt?: Date;
	updatedAt?: Date;
	rawPath?: string;
}

export type ModelMeta<R extends boolean = false> = R extends true ? Required<ModelMetaInternal> : ModelMetaInternal;

export type ModelDataOnly<T> = Omit<Clonable<T>, keyof ModelMeta>;

export class BaseModelClass<T> implements ModelMeta {
	@Exclude()
	private readonly __metadata?: ModelMeta;

	constructor(data: PatchUpdate<ModelDataOnly<T>> | ModelDataOnly<T>, meta?: ModelMeta) {
		this.__metadata = Object.assign({}, meta || {});
		plainToClassFromExist(this, data);
	}

	get id() {
		return this.__metadata?.id;
	}

	set id(id: string) {
		this.__metadata.id = id;
	}

	get createdAt() {
		return this.__metadata?.createdAt;
	}

	get updatedAt() {
		return this.__metadata.updatedAt;
	}

	get rawPath() {
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
