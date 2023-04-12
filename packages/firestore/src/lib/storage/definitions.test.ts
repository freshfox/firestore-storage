import { Timestamp } from '@google-cloud/firestore';
import { BaseRepository } from '../../lib';
import { BaseModel, CollectionPath, DocumentIds, Id, Repository } from 'firestore-storage-core';

export interface Model extends BaseModel {
	details?: {
		field1?: {
			subField1?: string;
			subField2?: string;
		};
		field2?: string;
	};
	someIds?: string[];
	startTime?: Timestamp;
	endTime?: Timestamp;
}

const GenericModelPath = new CollectionPath('genericModels', 'modelId');
@Repository({
	path: GenericModelPath,
})
export class ModelRepository extends BaseRepository<Model, typeof GenericModelPath> {}

export type AccountId = Id<'Account'>;
export type UserId = Id<'User'>;

export interface Account extends BaseModel {
	id: AccountId;
	name: string;
}

export interface User extends BaseModel {
	id: UserId;
	userName: string;
	lastSignIn?: Timestamp;
	address?: {
		street?: string;
		zip?: string;
		city?: string;
	};
}

export const AccountsPath = new CollectionPath<'accountId', AccountId>('accounts', 'accountId');
export const UsersPath = new CollectionPath<'userId', UserId, DocumentIds<typeof AccountsPath>>(
	'users',
	'userId',
	AccountsPath
);

@Repository({
	path: AccountsPath,
})
export class AccountRepository extends BaseRepository<Account, typeof AccountsPath> {}

@Repository({
	path: UsersPath,
})
export class UserRepository extends BaseRepository<User, typeof UsersPath> {}
