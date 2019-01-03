import {BaseRepository} from './base_repository';
import {ContainerModule} from 'inversify';
import {FirestoreStorage} from './firestore_storage';
import {MemoryStorage} from './memory_storage';
import * as admin from 'firebase-admin';
import {FirestoreInstance, IStorageDriver, Storage} from './storage';

export class FirestoreStorageModule {

	module: ContainerModule;

	private constructor(instance: admin.firestore.Firestore, defaultStorageDriver: any) {
		this.module = new ContainerModule((bind) => {
			bind(BaseRepository).toSelf().inSingletonScope();
			bind(FirestoreStorage).toSelf().inSingletonScope();
			bind(MemoryStorage).toSelf().inSingletonScope();
			bind(FirestoreInstance).toConstantValue(instance);
			bind<IStorageDriver>(Storage).to(defaultStorageDriver).inSingletonScope();
		});
	}

	static createWithMemoryStorage(): ContainerModule {
		let md = new FirestoreStorageModule(null, MemoryStorage);
		return md.module;
	}

	static createWithFirestore(instance: admin.firestore.Firestore): ContainerModule {
		let md = new FirestoreStorageModule(instance, FirestoreStorage);
		return md.module;
	}

}
