import 'reflect-metadata';
import { DEFAULT_DOCUMENT_TRANSFORMER, IDocumentTransformer } from './transformer';
import { CollectionIds, CollectionPath, DocumentIds } from './collections';
import { ModelDataOnly, PatchUpdate } from './types';

const transformerMetaKey = 'firestore:transformer';
const pathMetaKey = 'firestore:path';

export abstract class BaseRepository<T, Path extends CollectionPath<any, any, any>, DocSnap> {
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
	toFirestoreDocument(doc: ModelDataOnly<T> | PatchUpdate<ModelDataOnly<T>>): {
		id: undefined;
		data: ModelDataOnly<T>;
	};
	toFirestoreDocument(data: T | ModelDataOnly<T> | PatchUpdate<ModelDataOnly<T>>) {
		return this.getTransformer().toFirestoreDocument(data);
	}

	getDocumentPath(ids: DocumentIds<Path>) {
		return this.getPath().doc(ids);
	}

	getCollectionPath(ids: CollectionIds<Path>) {
		return this.getPath().collection(ids);
	}

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

export function Repository<T>(args: {
	path: CollectionPath<any, any, any>;
	transformer?: IDocumentTransformer<T>;
}): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(pathMetaKey, args.path, target);
		Reflect.defineMetadata(transformerMetaKey, args.transformer || DEFAULT_DOCUMENT_TRANSFORMER, target);
	};
}
