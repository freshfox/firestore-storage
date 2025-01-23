import { BaseModel, ModelQuery } from './types';
import { getPath } from 'ts-object-path';
import { Filter } from '@google-cloud/firestore';

export type WhereProp<T extends BaseModel> = string | ((t: T) => unknown);

export abstract class BaseQuery<T extends BaseModel, Op extends string, R> {
	protected abstract applyWhere(key: string | Filter, operator: Op, value: any): this;
	protected abstract applyWhere(filter: Filter): this;
	abstract execute(): R;

	where(propOrFilter: WhereProp<T> | Filter, op?: Op, value?: any) {
		if (propOrFilter instanceof Filter) {
			return this.applyWhere(propOrFilter);
		}
		return this.applyWhere(this.getWhereProp(propOrFilter), op!, value);
	}

	whereAll<K extends ModelQuery<T>>(attributes: K | null) {
		if (attributes) {
			const keys = Object.keys(attributes) as (keyof K)[];
			return keys.reduce((query, key) => {
				return query.applyWhere(String(key), '==' as any, attributes[key]);
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
