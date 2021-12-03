import {BaseModel, PatchUpdate} from "./base_model";
import {classToPlain, Exclude, plainToInstance, ClassConstructor, Transform, Type, plainToClassFromExist} from "class-transformer";

type NonFunctionPropertyNames<T> = {
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];
type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

type Clonable<T> = {
	[K in keyof NonFunctionProperties<T>]: T[K] extends object ? Clonable<T[K]> : T[K]
};

export interface ModelMeta {
	id?: string;
	createdAt?: Date;
	updatedAt?: Date;
	rawPath?: string;
}

export type ModelDataOnly<T> = Omit<Clonable<T>, keyof ModelMeta>;

export class BaseModelClass<T> implements BaseModel {

	@Exclude()
	private __metadata: ModelMeta = {};

	constructor(data: PatchUpdate<ModelDataOnly<T>> | ModelDataOnly<T>) {
		plainToClassFromExist(this, data);
	}

	get id() {
		return this.__metadata.id;
	}

	set id(id: string) {
		this.__metadata.id = id;
	}

	get createdAt() {
		return this.__metadata.createdAt;
	}

	set createdAt(date: Date) {
		this.__metadata.createdAt = date;
	}

	get updatedAt() {
		return this.__metadata.updatedAt;
	}

	set updatedAt(date: Date) {
		this.__metadata.updatedAt = date;
	}

	get rawPath() {
		return this.__metadata.rawPath;
	}

	set rawPath(path: string) {
		this.__metadata.rawPath = path;
	}

	getData(): ModelDataOnly<T> {
		return classToPlain(this) as any;
	}
}

export function serialize<T, V>(cls: ClassConstructor<T>, plain: V) {
	return plainToInstance(cls, plain)
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
		})(target, key)
		Type(() => Date)(target, key)
	}
}
