import {parsePath} from "./utils";

export type PathFunction = {
	(...ids: string[]): string;

	/**
	 * The full raw path with id placeholders
	 */
	path: string;
	/**
	 * The name of the collection
	 */
	collectionGroup: string;
	/**
	 * A map containing the collection name as a key and the id placeholder name as a value
	 */
	collectionIdMap: Map<string, string>;
}

export class CollectionUtils {
	static createPath(path: string): PathFunction {
		return (() => {
			const _f: PathFunction = (...ids: string[]) => {
				return this.replacePathSegments(path, ...ids);
			};
			_f.path = path;
			const parts = path.split('/');
			_f.collectionGroup = parts[parts.length - 2];
			_f.collectionIdMap = parsePath(path.replace(/\{|\}/g, ''));
			return _f;
		})();
	}

	static replacePathSegments(path: String, ...ids: string[]) {
		const arr = new Array(...ids);
		let lastArgument = false;
		return path.replace(/\/\{(\w+)\}/g, () => {
			const id = arr.shift();
			if (id) {
				return `/${id}`;
			}
			if (lastArgument) {
				throw new Error('Insufficient amount of arguments for ' + path);
			}
			lastArgument = true;
			return '';
		});
	}
}
