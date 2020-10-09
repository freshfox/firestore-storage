"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var MemoryStorage_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = exports.Collection = exports.MemoryTransaction = exports.MemoryQueryBuilder = exports.MemoryStorage = void 0;
require("reflect-metadata");
const uuid_1 = require("uuid");
const inversify_1 = require("inversify");
const _ = require("lodash");
const utils_1 = require("./utils");
let MemoryStorage = MemoryStorage_1 = class MemoryStorage {
    constructor() {
        this.data = new Document();
    }
    findById(collection, id) {
        const doc = this.data.getCollection(collection).getDocument(id, true);
        if (doc) {
            return Promise.resolve(MemoryStorage_1.mapWithId(id, doc));
        }
        return Promise.resolve(null);
    }
    find(collection, cb) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = this.getAsArray(collection);
            const query = cb(new MemoryQueryBuilder(items));
            const result = yield query.limit(1).get();
            return result[0] || null;
        });
    }
    save(collection, data, options) {
        const model = MemoryStorage_1.clone(data);
        const id = model.id ? model.id : this.generateId();
        this.addDocument(collection, id, model.data, options);
        return this.findById(collection, id);
    }
    addDocument(collection, id, data, options) {
        const doc = this.data.getCollection(collection).getDocument(id);
        const now = new Date();
        doc.updatedAt = now;
        if (doc.data) {
            if (options && options.avoidMerge) {
                doc.data = Object.assign({}, data);
            }
            else {
                _.merge(doc.data, data);
            }
        }
        else {
            doc.createdAt = now;
            doc.data = data;
        }
    }
    query(collection, cb) {
        const items = this.getAsArray(collection);
        const builder = new MemoryQueryBuilder(items);
        const query = cb ? cb(builder) : builder;
        return query.get();
    }
    batchGet(collection, ids) {
        const collectionRef = this.data.getCollection(collection);
        const items = ids.map((id) => {
            const doc = collectionRef.documents[id];
            if (doc) {
                return MemoryStorage_1.mapWithId(id, doc);
            }
            return null;
        });
        return Promise.resolve(items);
    }
    clear(collection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!collection) {
                this.data = new Document();
            }
            else {
                this.data.getCollection(collection).clear();
            }
        });
    }
    delete(collection, id) {
        delete this.data.getCollection(collection).documents[id];
        return Promise.resolve();
    }
    transaction(updateFunction, transactionOptions) {
        return updateFunction(new MemoryTransaction(this));
    }
    generateId() {
        return uuid_1.v4();
    }
    import(data) {
        this.data = new Document(data);
        return Promise.resolve();
    }
    setData(data) {
        return this.import(data);
    }
    getAsArray(collection) {
        const collectionRef = this.data.getCollection(collection);
        return Object.keys(collectionRef.documents)
            .map((key) => {
            return MemoryStorage_1.mapWithId(key, collectionRef.documents[key]);
        });
    }
    static mapWithId(id, doc) {
        return Object.assign({
            id,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        }, doc.data);
    }
    static clone(data) {
        try {
            this.checkForUndefined(data);
        }
        catch (err) {
            console.error(data);
            throw err;
        }
        const clone = Object.assign({}, data);
        const id = data.id;
        delete clone.id;
        delete clone.createdAt;
        delete clone.updatedAt;
        return {
            id: id,
            data: clone
        };
    }
    static checkForUndefined(data) {
        if (Array.isArray(data)) {
            for (const item of data) {
                this.checkForUndefined(item);
            }
        }
        else if (_.isPlainObject(data)) {
            const keys = Object.keys(data);
            for (const key of keys) {
                this.checkForUndefined(data[key]);
            }
        }
        else if (data === undefined) {
            throw new Error('Data contains undefined');
        }
    }
    export(base) {
        console.error('Export isn\'t implemented in MemoryStorage');
        return null;
    }
    stream(collection, query) {
        throw new Error('Streaming not implemented');
    }
    groupQuery(collectionId, cb) {
        const documents = [];
        this.loopOverCollections(this.data.collections, (name, docs) => {
            if (name !== collectionId) {
                return;
            }
            const docsWithId = Object.keys(docs).map((id) => {
                return MemoryStorage_1.mapWithId(id, docs[id]);
            });
            documents.push(...docsWithId);
        });
        const builder = new MemoryQueryBuilder(documents);
        const query = cb ? cb(builder) : builder;
        return query.get();
    }
    loopOverCollections(collectionMap, cb) {
        const names = Object.keys(collectionMap);
        for (const name of names) {
            const collection = collectionMap[name];
            const docIds = Object.keys(collection.documents);
            cb(name, collection.documents);
            for (const docId of docIds) {
                const doc = collection.documents[docId];
                if (doc.collections) {
                    this.loopOverCollections(doc.collections, cb);
                }
            }
        }
    }
};
MemoryStorage = MemoryStorage_1 = __decorate([
    inversify_1.injectable()
], MemoryStorage);
exports.MemoryStorage = MemoryStorage;
class MemoryQueryBuilder {
    constructor(data) {
        this.data = data;
        this.offsetNumber = 0;
        this.clauses = [];
    }
    where(field, operator, value) {
        this.clauses.push(check(field, operator, value));
        return this;
    }
    get() {
        if (!this.data || !this.data.length) {
            return Promise.resolve([]);
        }
        let items = this.data.filter((item) => {
            return this.clauses.reduce((prevValue, current) => {
                return prevValue && current(item);
            }, true);
        });
        if (this.ordering) {
            items.sort((a, b) => {
                const prop = this.ordering.property;
                const val1 = utils_1.toComparableValue(a[prop]);
                const val2 = utils_1.toComparableValue(b[prop]);
                if (val1 === val2) {
                    return 0;
                }
                if (this.ordering.direction === 'desc') {
                    if (val1 > val2) {
                        return -1;
                    }
                    return 1;
                }
                if (val1 < val2) {
                    return -1;
                }
                return 1;
            });
        }
        if (this.limitNumber) {
            items = items.slice(this.offsetNumber, this.offsetNumber + this.limitNumber);
        }
        else {
            items = items.slice(this.offsetNumber);
        }
        return Promise.resolve(items);
    }
    orderBy(property, direction) {
        this.ordering = {
            property, direction
        };
        return this;
    }
    limit(limit) {
        this.limitNumber = limit;
        return this;
    }
    offset(offset) {
        this.offsetNumber = offset;
        return this;
    }
    onSnapshot(onNext, onError) {
        throw new Error('not supported');
    }
    stream() {
        return null;
    }
}
exports.MemoryQueryBuilder = MemoryQueryBuilder;
class MemoryTransaction {
    constructor(storage) {
        this.storage = storage;
        this.didWrite = false;
    }
    create(collectionPath, data) {
        this.didWrite = true;
        const model = MemoryStorage.clone(data);
        this.storage.addDocument(collectionPath, this.storage.generateId(), model.data);
        return this;
    }
    delete(collectionPath, docId) {
        this.didWrite = true;
        delete this.storage.data.getCollection(collectionPath).documents[docId];
        return this;
    }
    get(collectionPath, docId) {
        if (this.didWrite) {
            throw MemoryTransaction.getReadAfterWriteError();
        }
        return this.storage.findById(collectionPath, docId);
    }
    query(collectionPath, cb) {
        if (this.didWrite) {
            throw MemoryTransaction.getReadAfterWriteError();
        }
        return this.storage.query(collectionPath, cb);
    }
    set(collectionPath, data) {
        this.didWrite = true;
        const model = MemoryStorage.clone(data);
        const id = model.id ? model.id : this.storage.generateId();
        this.storage.addDocument(collectionPath, id, model.data);
        return this;
    }
    setAvoidMerge(collectionPath, data) {
        this.didWrite = true;
        const model = MemoryStorage.clone(data);
        const id = model.id ? model.id : this.storage.generateId();
        this.storage.addDocument(collectionPath, id, model.data, { avoidMerge: true });
        return this;
    }
    update(collectionPath, data) {
        this.didWrite = true;
        const model = MemoryStorage.clone(data);
        if (!model.id) {
            throw new Error(`No document id found. Unable to update (${collectionPath}) ${JSON.stringify(model.data, null, 2)}`);
        }
        this.storage.addDocument(collectionPath, model.id, model.data);
        return this;
    }
    static getReadAfterWriteError() {
        return new Error('Firestore transactions require all reads to be executed before all writes.');
    }
}
exports.MemoryTransaction = MemoryTransaction;
const check = (field, operator, expected) => {
    return (data) => {
        const parts = field.split('.');
        let actual = parts.reduce((obj, key) => {
            if (!obj) {
                return null;
            }
            return obj[key];
        }, data);
        // If actual is falsy and expected is truthy return false
        if ((actual === null || actual === undefined) && expected) {
            return false;
        }
        actual = utils_1.toComparableValue(actual);
        expected = utils_1.toComparableValue(expected);
        if (operator === '==' && _.isPlainObject(expected)) {
            return _.isEqual(actual, expected);
        }
        switch (operator) {
            case '>': return actual > expected;
            case '>=': return actual >= expected;
            case '<': return actual < expected;
            case '<=': return actual <= expected;
            case '==': return actual === expected;
            case 'in':
                return expected.indexOf(actual) !== -1;
        }
        throw new Error(`Unsupported operator ${operator}`);
    };
};
class Collection {
    constructor(collection) {
        this.documents = {};
        if (collection && collection.documents) {
            this.documents = mapValues(collection.documents, (doc) => {
                return new Document(doc);
            });
        }
    }
    getDocument(path, avoidDocumentCreation) {
        const index = path.indexOf('/');
        if (index === -1) {
            return this.getOrCreateDocument(path, avoidDocumentCreation);
        }
        const docId = path.substring(0, index);
        const doc = this.getOrCreateDocument(docId);
        const rest = path.substring(index + 1);
        const nameEndIndex = rest.indexOf('/');
        const collectionName = rest.substring(0, nameEndIndex);
        return doc.getCollection(collectionName).getDocument(rest.substring(nameEndIndex + 1));
    }
    getOrCreateDocument(id, avoidDocumentCreation) {
        if (!this.documents[id]) {
            if (avoidDocumentCreation) {
                return null;
            }
            this.documents[id] = new Document();
        }
        return this.documents[id];
    }
    clear() {
        this.documents = {};
    }
    toJson() {
        return {
            documents: mapValues(this.documents, (doc) => {
                return doc.toJson();
            })
        };
    }
}
exports.Collection = Collection;
class Document {
    constructor(data) {
        this.collections = {};
        if (data) {
            this.data = Document.parseData(data.data);
            this.createdAt = new Date(data.createdAt);
            this.updatedAt = new Date(data.updatedAt);
            if (data.collections) {
                this.collections = mapValues(data.collections, (collection) => {
                    return new Collection(collection);
                });
            }
        }
    }
    getOrCreateCollection(name) {
        if (!this.collections[name]) {
            this.collections[name] = new Collection();
        }
        return this.collections[name];
    }
    getCollection(path) {
        const index = path.indexOf('/');
        if (index === -1) {
            return this.getOrCreateCollection(path);
        }
        const collectionName = path.substring(0, index);
        const collection = this.getOrCreateCollection(collectionName);
        const rest = path.substring(index + 1);
        const idEndIndex = rest.indexOf('/');
        const docId = rest.substring(0, idEndIndex);
        return collection.getDocument(docId).getCollection(rest.substring(idEndIndex + 1));
    }
    toJson() {
        return {
            data: Document.formatData(this.data),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            collections: mapValues(this.collections, (collection) => {
                return collection.toJson();
            })
        };
    }
    static parseData(data) {
        if (data === null || data === undefined) {
            return null;
        }
        if (_.isPlainObject(data)) {
            if (data.__instance === 'date') {
                return new Date(data.value);
            }
            else if (this.isTimestamp(data)) {
                //return new Timestamp(data._seconds, data._nanoseconds)
            }
            return mapValues(data, (value) => {
                return this.parseData(value);
            });
        }
        if (Array.isArray(data)) {
            return data.map((item) => {
                return this.parseData(item);
            });
        }
        return data;
    }
    static isTimestamp(value) {
        return (value.hasOwnProperty('_seconds') && value.hasOwnProperty('_nanoseconds'));
    }
    static formatData(data) {
        if (data === null || data === undefined) {
            return null;
        }
        if (data instanceof Date) {
            return {
                __instance: 'date',
                value: data.toISOString()
            };
        }
        if (_.isPlainObject(data)) {
            return mapValues(data, (value) => {
                return this.formatData(value);
            });
        }
        if (Array.isArray(data)) {
            return data.map((value) => {
                return this.formatData(value);
            });
        }
        return data;
    }
}
exports.Document = Document;
function mapValues(obj, mapper, filter) {
    return Object.keys(obj).reduce((result, id) => {
        const value = obj[id];
        if (!filter || filter(id, value)) {
            result[id] = mapper(value, id);
        }
        return result;
    }, {});
}
//# sourceMappingURL=memory_storage.js.map