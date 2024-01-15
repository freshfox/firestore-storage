import { BaseModel } from './types';

export class FirestoreStorageError<T extends BaseModel> extends Error {
	constructor(public rawPath: string, public readonly ids: object, msg?: string) {
		super(`Unable to get document from ${rawPath}. ${JSON.stringify(ids)} (${msg || ''})`);
	}
}
