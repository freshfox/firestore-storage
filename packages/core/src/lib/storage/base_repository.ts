import {DEFAULT_DOCUMENT_TRANSFORMER, IDocumentTransformer} from "./transformer";
import {PathFunction} from "./collection_utils";

const transformerMetaKey = 'firestore:transformer';
const pathMetaKey = 'firestore:path';


export abstract class BaseRepository<T> {

	protected constructor() {
		const path: PathFunction = Reflect.getMetadata(pathMetaKey, this.constructor);
		if (!path) {
			throw new Error(`Unable to get path for ${this.constructor.name}. Did you add the @Repository decorator`);
		}
	}

	getPath(...docIds: string[]) {
		const path = this.getPathFunction();
		return path(...docIds);
	}

	getCollectionName() {
		const path = this.getPathFunction();
		return path.collectionGroup;
	}

	protected getPathFunction(): PathFunction {
		return Reflect.getMetadata(pathMetaKey, this.constructor);
	}

	protected getTransformer(): IDocumentTransformer<T> {
		return Reflect.getMetadata(transformerMetaKey, this.constructor);
	}

}

export function Repository<T>(args: {
	path: PathFunction
	transformer?: IDocumentTransformer<T>;
}): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(pathMetaKey, args.path, target);
		Reflect.defineMetadata(transformerMetaKey, args.transformer || DEFAULT_DOCUMENT_TRANSFORMER, target);
	}
}
