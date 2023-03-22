import {
	CollectionGroup,
	CollectionReference,
	DocumentData,
	OrderByDirection,
	QuerySnapshot,
	WhereFilterOp,
	Query as FSQuery
} from "@google-cloud/firestore";
import {BaseQuery} from "firestore-storage-core";

export class Query<T extends DocumentData> extends BaseQuery<T, WhereFilterOp, OrderByDirection, Promise<QuerySnapshot<T>>> {

	constructor(private base: CollectionReference | CollectionGroup | FSQuery) {
		super();
	}

	protected applyWhere(key: string, operator: FirebaseFirestore.WhereFilterOp, value: any) {
		this.base = this.base.where(key, operator, value);
		return this;
	}

	protected applyOrderBy(key: string, direction: OrderByDirection) {
		this.base = this.base.orderBy(key, direction);
		return this;
	}

	protected applyOffset(offset: number): this {
		this.base = this.base.offset(offset);
		return this;
	}

	protected applyLimit(limit: number): this {
		this.base = this.base.limit(limit);
		return this;
	}

	execute(): Promise<QuerySnapshot<T>> {
		return this.base.get() as any;
	}

}
