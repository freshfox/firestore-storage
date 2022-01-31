"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFirestoreSnapshot = exports.parseFirestoreChange = void 0;
/**
 * Takes the Firestore change and event context of a Firestore function hook, parses the data and returns a typed result.
 * Pass the path ids ordered by their hierarchical position. The last id will be written on the returned before and after models
 * @param change - Change of the Firestore function
 * @param context - Event context of the Firestore function
 * @param firstId - First and required path id
 * @param idNames - Additional path ids
 */
function parseFirestoreChange(change, context, firstId, ...idNames) {
    var _a, _b;
    const { lastId, ids } = getIdMap(context, firstId, idNames);
    return {
        before: data((_a = change.before) === null || _a === void 0 ? void 0 : _a.data(), lastId),
        after: data((_b = change.after) === null || _b === void 0 ? void 0 : _b.data(), lastId),
        ids
    };
}
exports.parseFirestoreChange = parseFirestoreChange;
function parseFirestoreSnapshot(snapshot, context, firstId, ...idNames) {
    const { lastId, ids } = getIdMap(context, firstId, idNames);
    return {
        data: data(snapshot.data(), lastId),
        ids
    };
}
exports.parseFirestoreSnapshot = parseFirestoreSnapshot;
function data(data, id) {
    if (data) {
        data.id = id;
        return data;
    }
    return null;
}
function getIdMap(context, firstId, idNames) {
    const ids = {};
    let lastId;
    idNames.unshift(firstId);
    for (const idName of idNames) {
        const id = context.params[idName];
        if (id) {
            lastId = ids[idName] = id;
        }
        else {
            console.error(idName, 'not found in document path', context);
        }
    }
    return {
        lastId, ids
    };
}
//# sourceMappingURL=utils.js.map