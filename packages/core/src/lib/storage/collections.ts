export type CollectionIds<C extends CollectionPath<any, any, any>, D = void> = C extends CollectionPath<
	infer IdKey,
	infer IdType,
	infer P
>
	? P
	: D;

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
	 * Returns the collection path template
	 * /accounts/{accountId}/users/{userId}
	 */
	path(): string {
		return `${this.parent ? this.parent.path() : ''}/${this.collectionName}/{${this.idKey}}`;
	}

	collection(ids: P): string {
		return `${this.parent ? this.parent.doc(ids) : ''}/${this.collectionName}`;
	}

	doc(ids: DocumentIds<this>): string {
		const id = ids[this.idKey];
		if (!id) {
			throw new Error(`Missing ${this.idKey} in ids`);
		}
		return `${this.collection(ids as CollectionIds<this>)}/${id}`;
	}

	toDocIds(ids: CollectionIds<this>, docId: IdType): DocumentIds<this> {
		return {
			...ids,
			[this.idKey]: docId,
		} as DocumentIds<this>;
	}
}
