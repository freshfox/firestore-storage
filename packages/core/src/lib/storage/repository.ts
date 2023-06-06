import 'reflect-metadata';
import { DEFAULT_DOCUMENT_TRANSFORMER, IDocumentTransformer } from './transformer';
import { CollectionIds, CollectionPath, DocumentIds } from './collections';
import { BaseModel, ModelDataOnly, ModelDataWithId, PatchUpdate } from './types';

const transformerMetaKey = 'firestore:transformer';
const pathMetaKey = 'firestore:path';

/**
 * Base class for platform independent repositories. Contains methods accessing its metadata supplied
 * via the Typescript @Repository decorator
 */
export abstract class BaseRepository<T extends BaseModel, Path extends CollectionPath<any, any, any>, DocSnap> {
	private readonly collectionPath: Path;
	private readonly transformer: IDocumentTransformer<T>;

	protected constructor() {
		this.collectionPath = Reflect.getMetadata(pathMetaKey, this.constructor);
		if (!this.collectionPath) {
			throw new Error(`Unable to get path for ${this.constructor.name}. Did you add the @Repository decorator`);
		}
		this.transformer = Reflect.getMetadata(transformerMetaKey, this.constructor);
	}

	protected abstract fromFirestoreToObject(snap: DocSnap): T;

	toFirestoreDocument(doc: T): { id: string; data: ModelDataOnly<T> };
	toFirestoreDocument(doc: ModelDataOnly<T> | PatchUpdate<ModelDataWithId<T>>): {
		id: undefined;
		data: ModelDataOnly<T>;
	};
	toFirestoreDocument(data: T | ModelDataOnly<T> | PatchUpdate<ModelDataWithId<T>>) {
		return this.getTransformer().toFirestoreDocument(data);
	}

	/**
	 * Returns the path to the document as a string
	 * @param ids - A map containing all ids up to the document itself
	 */
	getDocumentPath(ids: DocumentIds<Path>): string {
		return this.getPath().doc(ids);
	}

	/**
	 * Returns the path to the collection as a string
	 * @param ids - A map containing all ids excluding the last documents id
	 */
	getCollectionPath(ids: CollectionIds<Path>) {
		return this.getPath().collection(ids);
	}

	/**
	 * Returns the standalone collection name
	 */
	getCollectionName() {
		return this.getPath().collectionName;
	}

	getPath(): Path {
		return this.collectionPath;
	}

	protected getTransformer(): IDocumentTransformer<T> {
		return this.transformer;
	}
}

export function Repository<T extends BaseModel>(args: {
	path: CollectionPath<any, any, any>;
	transformer?: IDocumentTransformer<T>;
}): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(pathMetaKey, args.path, target);
		Reflect.defineMetadata(transformerMetaKey, args.transformer || DEFAULT_DOCUMENT_TRANSFORMER, target);
	};
}
