"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSameReferenceMap = exports.toReferenceMapFromIds = exports.toReferenceMap = void 0;
function toReferenceMap(...entities) {
    return entities.reduce((map, entity) => {
        map[entity.id] = true;
        return map;
    }, {});
}
exports.toReferenceMap = toReferenceMap;
function toReferenceMapFromIds(ids, value = true) {
    return ids.reduce((map, id) => {
        map[id] = value;
        return map;
    }, {});
}
exports.toReferenceMapFromIds = toReferenceMapFromIds;
function isSameReferenceMap(r1, r2) {
    const ids1 = Object.keys(r1);
    const ids2 = Object.keys(r2);
    if (ids1.length !== ids2.length) {
        return false;
    }
    for (const id of ids1) {
        if (ids2.indexOf(id) === -1) {
            return false;
        }
    }
    return true;
}
exports.isSameReferenceMap = isSameReferenceMap;
//# sourceMappingURL=base_model.js.map