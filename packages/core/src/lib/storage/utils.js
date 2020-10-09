"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toComparableValue = exports.isTimestamp = exports.DocumentChange = void 0;
const isPlainObject = require("lodash.isplainobject");
const isEqual = require("lodash.isequal");
class DocumentChange {
    constructor(change) {
        this.change = change;
        if (change.after) {
            const allKeys = Object.keys(change.after);
            if (change.before) {
                this.changedKeys = allKeys.filter((key) => {
                    return !DocumentChange.eql(change.before[key], change.after[key]);
                });
            }
            else {
                this.changedKeys = allKeys;
            }
        }
        else {
            this.changedKeys = [];
        }
    }
    get before() {
        return this.change.before;
    }
    get after() {
        return this.change.after;
    }
    get ids() {
        return this.change.ids;
    }
    hasChanged(...keys) {
        for (const key of keys) {
            if (this.changedKeys.includes(key)) {
                return true;
            }
        }
        return false;
    }
    static eql(v1, v2) {
        if (isPlainObject(v1) && isPlainObject(v2)) {
            return isEqual(v1, v2);
        }
        return toComparableValue(v1) === toComparableValue(v2);
    }
}
exports.DocumentChange = DocumentChange;
function isTimestamp(value) {
    var _a;
    if (!value) {
        return false;
    }
    return value.hasOwnProperty('_seconds')
        && value.hasOwnProperty('_nanoseconds')
        && ((_a = value.constructor) === null || _a === void 0 ? void 0 : _a.name);
}
exports.isTimestamp = isTimestamp;
function toComparableValue(val) {
    if (val instanceof Date)
        return val.getTime();
    if (isTimestamp(val))
        return val.toMillis();
    return val;
}
exports.toComparableValue = toComparableValue;
//# sourceMappingURL=utils.js.map