import {BaseRepository} from './base_repository';
import {ContainerModule} from 'inversify';
import {FirestoreStorage} from './firestore_storage';
import {MemoryStorage} from './memory_storage';
import * as admin from 'firebase-admin';
import {FirestoreInstance} from './storage';

export class FirestoreStorageModule {

	private module: ContainerModule;

	constructor(instance: admin.firestore.Firestore) {
		this.module = new ContainerModule((bind) => {
			bind(BaseRepository).toSelf().inSingletonScope();
			bind(FirestoreStorage).toSelf().inSingletonScope();
			bind(MemoryStorage).toSelf().inSingletonScope();
			bind(FirestoreInstance).toConstantValue(instance);
		})
	}

	static create(instance: admin.firestore.Firestore): ContainerModule {
		let md = new FirestoreStorageModule(instance);
		return md.module;
	}

}
