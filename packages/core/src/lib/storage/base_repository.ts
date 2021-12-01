import {IDocumentTransformer} from "./transformer";
import {PathFunction} from "./collection_utils";

const transformerMetaKey = 'firestore:transformer';
const pathMetaKey = 'firestore:path';


export abstract class BaseRepository<T> {

	getPath(...docIds: string[]) {
		const path = this.getPathFunction();
		return path(...docIds);
	}

	getCollectionName() {
		const path = this.getPathFunction();
		return path.collectionGroup;
	}

	protected getPathFunction(): PathFunction {
		const path: PathFunction = Reflect.getMetadata(pathMetaKey, this.constructor);
		if (!path) {
			throw new Error(`Unable to get path for ${this.constructor.name}. Did you add the @Repository decorator`);
		}
		return path;
	}

	protected getTransformer(): IDocumentTransformer<T> | undefined {
		return Reflect.getMetadata(transformerMetaKey, this.constructor);
	}

}

export function Repository<T>(args: {
	path: PathFunction
	transformer?: IDocumentTransformer<T>;
}): ClassDecorator {
	return (target) => {
		Reflect.defineMetadata(pathMetaKey, args.path, target);
		Reflect.defineMetadata(transformerMetaKey, args.transformer, target);
	}
}
