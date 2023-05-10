import { BaseModel, ModelQuery } from './types';
import { getPath } from 'ts-object-path';

export type WhereProp<T extends BaseModel> = string | ((t: T) => unknown);

export abstract class BaseQuery<T extends BaseModel, Op extends string, R> {
	protected abstract applyWhere(key: string, operator: Op, value: any): this;
	abstract execute(): R;

	where(prop: WhereProp<T>, op: Op, value: any) {
		return this.applyWhere(this.getWhereProp(prop), op, value);
	}

	whereAll(attributes: ModelQuery<T> | null) {
		if (attributes) {
			return Object.keys(attributes).reduce((query, key) => {
				return query.applyWhere(key, '==' as any, attributes[key]);
			}, this);
		}
		return this;
	}

	protected getWhereProp(prop: WhereProp<T>): string {
		if (typeof prop === 'string') return prop;
		return getPath<T, (t: T) => unknown>(prop).join('.');
	}

	equals(prop: WhereProp<T>, value: any) {
		return this.where(prop, '==' as any, value);
	}
}
