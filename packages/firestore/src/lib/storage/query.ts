import {
	CollectionGroup,
	CollectionReference,
	OrderByDirection,
	QuerySnapshot,
	WhereFilterOp,
	Query as FSQuery,
	Filter,
} from '@google-cloud/firestore';
import { BaseQuery, BaseModel, WhereProp } from 'firestore-storage-core';

export class Query<T extends BaseModel> extends BaseQuery<T, WhereFilterOp, Promise<QuerySnapshot<T>>> {
	constructor(private base: CollectionReference | CollectionGroup | FSQuery) {
		super();
	}

	protected applyWhere<K extends string | Filter>(
        keyOrFilter: K,
        ...args: K extends string 
            ? [FirebaseFirestore.WhereFilterOp, any]
            : []
    ): this {
        if (typeof keyOrFilter === 'string') {
            const [operator, value] = args as [FirebaseFirestore.WhereFilterOp, any];
            this.base = this.base.where(keyOrFilter, operator, value);
        } else {
            this.base = this.base.where(keyOrFilter as Filter);
        }
        return this;
    }

	orderBy(prop: WhereProp<T>, direction: OrderByDirection) {
		this.base = this.base.orderBy(this.getWhereProp(prop), direction);
		return this;
	}

	limit(limit: number) {
		this.base = this.base.limit(limit);
		return this;
	}

	offset(offset: number) {
		this.base = this.base.offset(offset);
		return this;
	}

	execute(): Promise<QuerySnapshot<T>> {
		return this.base.get() as any;
	}

	count() {
		return this.base.count();
	}

	getQuery() {
		return this.base;
	}
}
