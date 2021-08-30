import {BaseModel} from "./base_model";

export class FirestoreStorageError<T extends BaseModel> extends Error {

	public readonly id: string | null;

	constructor(public readonly attributes: Partial<T>,
				public readonly path: string) {
		super(`Unable to get document${attributes?.id ? `(${attributes.id})` : ''} from ${path}`);
		this.id = attributes?.id || null;
	}



}
