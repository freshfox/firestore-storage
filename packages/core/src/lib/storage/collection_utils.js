"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionUtils = void 0;
class CollectionUtils {
    static createPath(path) {
        return (() => {
            const _f = (...ids) => {
                return this.replacePathSegments(path, ...ids);
            };
            _f.path = path;
            const parts = path.split('/');
            _f.collectionGroup = parts[parts.length - 2];
            return _f;
        })();
    }
    static replacePathSegments(path, ...ids) {
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
exports.CollectionUtils = CollectionUtils;
//# sourceMappingURL=collection_utils.js.map