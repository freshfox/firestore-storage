import {BaseRepository} from './base_repository';
import {ContainerModule} from 'inversify';
import {FirestoreStorage} from './firestore_storage';
import * as admin from 'firebase-admin';
import {ErrorFactory, FirestoreInstance, IErrorFactory, IStorageDriver, StorageDriver, MemoryStorage} from 'firestore-storage-core';
import {DynamicModule, Module, Provider} from "@nestjs/common";

function getProviders(storage: (new (...args: any[]) => IStorageDriver), firestore?: admin.firestore.Firestore, errorFactory?: IErrorFactory): Provider[] {
	return [
		FirestoreStorage,
		MemoryStorage,
		{
			provide: StorageDriver,
			useExisting: storage,
		},
		{
			provide: ErrorFactory,
			useValue: errorFactory || ((message: string) => {
				return new Error(message);
			})
		},
		{
			provide: FirestoreInstance,
			useValue: firestore
		}
	];
}

@Module({})
export class FirestoreStorageNestModule {

	static withMemoryStorage(errorFactory?: IErrorFactory) {
		return this.with(MemoryStorage, null, errorFactory);
	}

	static withFirestore(firestore: admin.firestore.Firestore, errorFactory?: IErrorFactory) {
		return this.with(FirestoreStorage, firestore, errorFactory)
	}

	private static with(storage: (new (...args: any[]) => IStorageDriver), firestore?: admin.firestore.Firestore, errorFactory?: IErrorFactory): DynamicModule {
		const providers = getProviders(storage, firestore, errorFactory);
		return {
			module: FirestoreStorageModule,
			providers: providers,
			exports: providers
		}
	}
}

export class FirestoreStorageModule {

	module: ContainerModule;

	constructor(instance: admin.firestore.Firestore, defaultStorageDriver: any, errorFactory?: IErrorFactory) {
		this.module = new ContainerModule((bind) => {
			bind(BaseRepository).toSelf().inSingletonScope();
			bind(FirestoreStorage).toSelf().inSingletonScope();
			bind(MemoryStorage).toSelf().inSingletonScope();
			bind(FirestoreInstance).toConstantValue(instance);
			bind<IStorageDriver>(StorageDriver).to(defaultStorageDriver).inSingletonScope();
			bind<IErrorFactory>(ErrorFactory).toFactory<Error>(() => {
				if (errorFactory) {
					return errorFactory;
				}
				return
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
