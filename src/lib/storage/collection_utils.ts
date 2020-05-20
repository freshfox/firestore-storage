
type Tuple<TItem, TLength extends number> = [TItem, ...TItem[]] & { length: TLength };
export type IdTuple<NumOfIds extends number> = Tuple<string, NumOfIds>
export type PathFunction<NumOfIds extends number> = { (...ids: IdTuple<NumOfIds>): string; path: string; }

export class CollectionUtils {
	static createPath<NumOfIds extends number>(path: string): PathFunction<NumOfIds> {
		return (() => {
			const _f: PathFunction<NumOfIds> = (...ids: IdTuple<NumOfIds>) => {
				return this.replacePathSegments(path, ...ids);
			};
			_f.path = path;
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
