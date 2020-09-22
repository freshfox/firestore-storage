export type PathFunction = { (...ids: string[]): string; path: string; collectionGroup: string }

export class CollectionUtils {
	static createPath(path: string): PathFunction {
		return (() => {
			const _f: PathFunction = (...ids: string[]) => {
				return this.replacePathSegments(path, ...ids);
			};
			_f.path = path;
			const parts = path.split('/');
			_f.collectionGroup = parts[parts.length - 2];
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
