import {BaseRepository} from './base_repository';
import {ContainerModule} from 'inversify';
import {FirestoreStorage} from './firestore_storage';
import * as admin from 'firebase-admin';
import {ErrorFactory, FirestoreInstance, IErrorFactory, IStorageDriver, StorageDriver, MemoryStorage} from 'firestore-storage-core';
import {DynamicModule, FactoryProvider, Injectable, Module, ModuleMetadata, Provider, Type} from "@nestjs/common";

Reflect.decorate([Injectable()], MemoryStorage);

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

export class FirestoreStorageNestModule {

	static forRootAsync(options: FirestoreModuleAsyncOptions, errorFactory?: IErrorFactory): DynamicModule {
		return {
			imports: options.imports || [],
			module: FirestoreStorageNestModule,
			providers: [
				FirestoreStorage,
				MemoryStorage,
				{
					provide: StorageDriver,
					useExisting: FirestoreStorage,
				},
				{
					provide: ErrorFactory,
					useValue: errorFactory || ((message: string) => {
						return new Error(message);
					})
				},
				...this.createConnectProviders(options)
			],
			exports: [
				FirestoreStorage,
				MemoryStorage,
				{
					provide: StorageDriver,
					useExisting: StorageDriver
				},
				{
					provide: ErrorFactory,
					useExisting: ErrorFactory
				}
			],
		};
	}

	private static createConnectProviders(
		options: FirestoreModuleAsyncOptions,
	): Provider[] {
		if (options.useExisting || options.useFactory) {
			return [this.createConnectOptionsProvider(options)];
		}

		// for useClass
		return [
			this.createConnectOptionsProvider(options),
			{
				provide: options.useClass,
				useClass: options.useClass,
			},
		];
	}

	private static createConnectOptionsProvider(
		options: FirestoreModuleAsyncOptions,
	): Provider {
		if (options.useFactory) {

			// for useFactory
			return {
				provide: FirestoreInstance,
				useFactory: options.useFactory,
				inject: options.inject || [],
			};
		}

		// For useExisting...
		return {
			provide: FirestoreInstance,
			useFactory: async (factory: FirestoreFactory) =>
				await factory.createFirestoreInstance(),
			inject: [options.useExisting || options.useClass],
		};
	}

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

export interface FirestoreFactory {
	createFirestoreInstance(): Promise<admin.firestore.Firestore> | admin.firestore.Firestore;
}

export interface FirestoreModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {

	/**
	 * Existing Provider to be used.
	 */
	useExisting?: Type<FirestoreFactory>;

	/**
	 * Type (class name) of provider (instance to be registered and injected).
	 */
	useClass?: Type<FirestoreFactory>;

	/**
	 * Factory function that returns an instance of the provider to be injected.
	 */
	useFactory?: (
		...args: any[]
	) => Promise<admin.firestore.Firestore> | admin.firestore.Firestore;

	/**
	 * Optional list of providers to be injected into the context of the Factory function.
	 */
	inject?: FactoryProvider['inject'];
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
