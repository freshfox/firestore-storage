import {BaseRepository} from './base_repository';
import {ContainerModule} from 'inversify';
import {FirestoreStorage} from './firestore_storage';
import * as admin from 'firebase-admin';
import {ErrorFactory, FirestoreInstance, IErrorFactory, IStorageDriver, Storage, MemoryStorage} from 'firestore-storage-core';

export class FirestoreStorageModule {

	module: ContainerModule;

	private constructor(instance: admin.firestore.Firestore, defaultStorageDriver: any, errorFactory?: IErrorFactory) {
		this.module = new ContainerModule((bind) => {
			bind(BaseRepository).toSelf().inSingletonScope();
			bind(FirestoreStorage).toSelf().inSingletonScope();
			bind(MemoryStorage).toSelf().inSingletonScope();
			bind(FirestoreInstance).toConstantValue(instance);
			bind<IStorageDriver>(Storage).to(defaultStorageDriver).inSingletonScope();
			bind<IErrorFactory>(ErrorFactory).toFactory<Error>(() => {
				if (errorFactory) {
					return errorFactory;
				}
				return (message: string) => {
					return new Error(message);
				}
			});
		});
	}

	static createWithMemoryStorage(errorFactory?: IErrorFactory): ContainerModule {
		let md = new FirestoreStorageModule(null, MemoryStorage, errorFactory);
		return md.module;
	}

	static createWithFirestore(instance: admin.firestore.Firestore, errorFactory?: IErrorFactory): ContainerModule {
		let md = new FirestoreStorageModule(instance, FirestoreStorage, errorFactory);
		return md.module;
	}

}
