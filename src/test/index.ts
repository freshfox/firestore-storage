import 'reflect-metadata';
import {Container, interfaces} from 'inversify';
import {BaseRepository} from '../lib/storage/base_repository';
import {FirestoreStorageModule} from '../lib/storage/module';
import {IStorageDriver} from '../lib/storage/storage';
import {MemoryStorage} from '../lib/storage/memory_storage';
import {BaseModel} from '../lib/storage/base_model';

export class TestFactory {

	static createWithRepository<T extends BaseRepository<any>>(context, repoConstructor: interfaces.Newable<T>) {
		const tc = new TestCase();
		tc.container.bind(repoConstructor).toSelf().inSingletonScope();

		context.beforeEach(() => {
			return tc.resolve(repoConstructor).clear();
		});

		return tc;
	}

}

export class TestCase {

	container = new Container();

	constructor() {
		this.container.load(FirestoreStorageModule.create(null));
	}

	resolve<T>(constructorFunction: interfaces.Newable<T>): T {
		return this.container.resolve(constructorFunction);
	}

	getStorage(): IStorageDriver {
		return this.container.resolve(MemoryStorage);
	}

}

export interface User extends BaseModel {

	name?: string;
	email?: string;
	last_login?: Date;

}

export class UserRepository extends BaseRepository<User> {

	getCollectionPath(...documentIds: string[]): string {
		return 'users';
	}

}
