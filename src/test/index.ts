import 'reflect-metadata';
import {Container, interfaces} from 'inversify';
import {BaseRepository} from '../lib/storage/base_repository';
import {FirestoreStorageModule} from '../lib/storage/module';
import {IStorageDriver} from '../lib/storage/storage';
import {MemoryStorage} from '../lib/storage/memory_storage';
import {BaseModel} from '../lib/storage/base_model';
import * as admin from 'firebase-admin';

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
		TestCase.initWithMemoryStorage(this);
	}

	resolve<T>(constructorFunction: interfaces.Newable<T>): T {
		return this.container.resolve(constructorFunction);
	}

	getStorage(): IStorageDriver {
		return this.container.resolve(MemoryStorage);
	}

	private static initWithFirestore(tc: TestCase) {
		admin.initializeApp({
			credential: admin.credential.cert(require('/home/dominic/Downloads/firestore-storage-test-firebase-adminsdk-pvcvb-f50c0471f1.json')),
			databaseURL: "https://firestore-storage-test.firebaseio.com"
		});
		tc.container.load(FirestoreStorageModule.createWithFirestore(admin.firestore()))
	}

	private static initWithMemoryStorage(tc: TestCase) {
		tc.container.load(FirestoreStorageModule.createWithMemoryStorage())
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
