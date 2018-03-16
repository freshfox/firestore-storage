import 'reflect-metadata';
import {Container, interfaces} from 'inversify';
import {BaseRepository} from '../lib/storage/base_repository';
import {FirestoreStorageModule} from '../lib/storage/module';
import {IStorageDriver} from '../lib/storage/storage';
import {MemoryStorage} from '../lib/storage/memory_storage';

export class TestFactory {

	static createWithRepository<T extends BaseRepository<any>>(repoConstructor: interfaces.Newable<T>) {
		const tc = new TestCase();
		tc.container.bind(repoConstructor);
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
