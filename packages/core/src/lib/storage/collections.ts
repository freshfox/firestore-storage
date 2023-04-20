/**
 * A generic type used to generate a new type from a given collection path. The generated type is
 * a map with keys for each id of this path leading up to this collection.
 */
export type CollectionIds<C extends CollectionPath<any, any, any>, D = void> = C extends CollectionPath<
	infer IdKey,
	infer IdType,
	infer P
>
	? P
	: D;

/**
 * A generic type used to generate a new type from a given collection path. The generated type is
 * a map with keys for each id of this path leading up to a document in this collection.
 */
export type DocumentIds<C extends CollectionPath<any, any, any>> = C extends CollectionPath<
	infer IdKey,
	infer IdType,
	infer P
>
	? P extends void
		? { [k in IdKey]: IdType }
		: P & {
				[k in IdKey]: IdType;
		  }
	: never;

export class CollectionPath<IdKey extends string, IdType extends string, P extends object | void = void> {
	constructor(
		public readonly collectionName: string,
		public readonly idKey: IdKey,
		private parent?: CollectionPath<any, any, any>
	) {}

	/**
	 * @returns The path as a template. e.g. /accounts/{accountId}/users/{userId}
	 */
	path(): string {
		return `${this.parent ? this.parent.path() : ''}/${this.collectionName}/{${this.idKey}}`;
	}

	/**
	 * Generates the path to this collection
	 * @param ids Ids of all parent documents
	 */
	collection(ids: P): string {
		return `${this.parent ? this.parent.doc(ids) : ''}/${this.collectionName}`;
	}

	/**
	 * Generates the path to a single document in this collection
	 * @param ids Ids of this document and all parent documents
	 */
	doc(ids: DocumentIds<this>): string {
		const id = ids[this.idKey];
		if (!id) {
			console.error(ids);
			throw new Error(`Missing ${this.idKey} in ids`);
		}
		return `${this.collection(ids as CollectionIds<this>)}/${id}`;
	}

	/**
	 * Generates an id map for a document in this collection including all parent document ids
	 * @param ids
	 * @param docId
	 */
	toDocIds(ids: CollectionIds<this>, docId: IdType): DocumentIds<this> {
		return {
			...ids,
			[this.idKey]: docId,
		} as DocumentIds<this>;
	}

	parse(path: string): DocumentIds<this> {
		const parts = path.split('/');
		// Remove optional first /
		if (parts[0] === '') {
			parts.splice(0, 1);
		}
		return this.extractId({}, parts) as DocumentIds<this>;
	}

	protected extractId<T extends DocumentIds<this>>(map: Partial<T>, path: string[]): Partial<T> {
		if (this.parent) {
			this.parent.extractId(map, path);
		}
		if (path[0] === this.collectionName && path[1] && typeof path[1] === 'string') {
			map[this.idKey] = path[1] as any;
			path.splice(0, 2);
			return map;
		}
		throw new Error(`Unable to get id for ${this.collectionName} from ${path.join('/')}`);
	}
}
