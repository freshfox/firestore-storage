"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryScope = exports.IndexFieldOrder = exports.IndexManager = void 0;
class IndexManager {
    constructor() {
        this.indexes = [];
    }
    addIndex(collectionGroup, queryScope) {
        return new IndexBuilder(this, collectionGroup, queryScope);
    }
    toObject() {
        return {
            indexes: this.indexes
        };
    }
    toJSON(space) {
        return JSON.stringify(this.toObject(), null, space);
    }
}
exports.IndexManager = IndexManager;
class IndexBuilder {
    constructor(parent, collectionGroup, queryScope) {
        this.parent = parent;
        this.entry = {
            collectionGroup,
            queryScope,
            fields: []
        };
    }
    field(fieldPath, order) {
        this.entry.fields.push({
            fieldPath: fieldPath,
            order: order || IndexFieldOrder.Asc
        });
        return this;
    }
    add() {
        if (this.entry.fields.length < 2) {
            throw new Error(`Not enough fields provided to create an index for ${this.entry.collectionGroup}`);
        }
        this.parent.indexes.push(this.entry);
        return this.parent;
    }
}
class FieldBuilder {
    constructor() {
        this.fields = [];
    }
    add(fieldPath, order) {
        this.fields.push({
            fieldPath: fieldPath,
            order: order || IndexFieldOrder.Asc
        });
        return this;
    }
}
var IndexFieldOrder;
(function (IndexFieldOrder) {
    IndexFieldOrder["Asc"] = "ASCENDING";
    IndexFieldOrder["Desc"] = "DESCENDING";
})(IndexFieldOrder = exports.IndexFieldOrder || (exports.IndexFieldOrder = {}));
var QueryScope;
(function (QueryScope) {
    QueryScope["Collection"] = "COLLECTION";
    QueryScope["CollectionGroup"] = "COLLECTION_GROUP";
})(QueryScope = exports.QueryScope || (exports.QueryScope = {}));
//# sourceMappingURL=index_manger.js.map