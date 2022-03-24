import { getPath } from 'ts-object-path';
export type KeyOf<T> = string | keyof T | ((t: T) => unknown);

export function extractPathParam<T>(param: KeyOf<T>): string {
	if (typeof param === 'string') return param;
	return getPath<T, (t: T) => unknown>(param).join('.');
}
