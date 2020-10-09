import 'reflect-metadata';
import {Container, interfaces} from 'inversify';
import {BaseRepository} from '../lib/storage/base_repository';
import {FirestoreStorageModule} from '../lib/storage/module';
import {IErrorFactory, IStorageDriver, Storage} from '../../../core/src/lib/storage/storage';
import {BaseModel, ReferenceMap} from '../../../core/src/lib/storage/base_model';
import * as admin from 'firebase-admin';
import * as env from 'node-env-file';
import * as fs from 'fs';
import Timestamp = admin.firestore.Timestamp;

const path = __dirname + '/../../.env';
if(fs.existsSync(path)){
	env(path);
}

export class TestFactory {

	static createWithRepository<T extends BaseRepository<any>>(context, repoConstructor: interfaces.Newable<T>,
															   errorFactory?: IErrorFactory,
															   forceFirebaseStorage?: boolean, ...ids: string[]) {
		const tc = new TestCase(errorFactory, forceFirebaseStorage);
		tc.container.bind(repoConstructor).toSelf().inSingletonScope();

		context.beforeEach(() => {
			return tc.resolve(repoConstructor).clear(...ids);
		});

		return tc;
	}

}

export class TestCase {

	container = new Container();

	constructor(errorFactory?: IErrorFactory, forceFirebaseStorage?: boolean) {
		const runWithFirestore = process.argv.indexOf('--firestore') >= 0;
		const credentialsFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
		if (runWithFirestore || forceFirebaseStorage) {
			if (!credentialsFile) {
				throw new Error('GOOGLE_APPLICATION_CREDENTIALS env variable not set');
			}
			TestCase.initWithFirestore(this, credentialsFile, errorFactory);
		} else {
			TestCase.initWithMemoryStorage(this, errorFactory);
		}
	}

	resolve<T>(constructorFunction: interfaces.Newable<T>): T {
		return this.container.resolve(constructorFunction);
	}

	getStorage(): IStorageDriver {
		return this.container.get<IStorageDriver>(Storage);
	}

	private static initWithFirestore(tc: TestCase, credentials: string, errorFactory?: IErrorFactory) {
		if (admin.apps.length === 0) {
			console.log('Initializing Firestore');
			admin.initializeApp({
				credential: admin.credential.cert(require(credentials)),
				databaseURL: 'https://firestore-storage-test.firebaseio.com'
			});
			admin.firestore().settings({
				timestampsInSnapshots: false
			})
		}
		tc.container.load(FirestoreStorageModule.createWithFirestore(admin.firestore(), errorFactory))
	}

	private static initWithMemoryStorage(tc: TestCase, errorFactory?: IErrorFactory) {
		tc.container.load(FirestoreStorageModule.createWithMemoryStorage(errorFactory))
	}

}

export interface User extends BaseModel {

	name?: string;
	/** @deprecated */firstname?: string;
	/** @deprecated */lastname?: string;
	email?: string;
	last_login?: Timestamp;
	address?: {
		street?: string;
		postal?: number;
		city: string;
	},
	tags?: string[]
}

const testRunId = Date.now();
export function getFirestoreTestCollection() {
	return 'tests';
}
export function getFirestoreTestRunId() {
	return `${testRunId}`;
}
export function getFirestoreTestPath(path?: string) {
	const parts = [getFirestoreTestCollection(), getFirestoreTestRunId()]
	if (path) {
		parts.push(path);
	}
	return parts.join('/');
}

export class UserRepository extends BaseRepository<User> {

	getCollectionPath(...documentIds: string[]): string {
		return getFirestoreTestPath(`users`);
	}

}

export interface Guest extends BaseModel {

	gender?: 'm' | 'f';
	locale?: string;
	company?: string;
	birthday?: string;
	firstname?: string;
	lastname?: string;
	address?: string;
	phone?: string;
	email?: string;
	onBlacklist?: boolean;
	notes?: string;
	tagIds?: ReferenceMap;
	deleted?: boolean;
	protelId?: string;
}

export class GuestRepository extends BaseRepository<Guest> {

	getCollectionPath(...ids: string[]) {
		if (!ids[0]) {
			throw new Error('account id missing');
		}
		return getFirestoreTestPath(`accounts/${ids[0]}/guests`);
	}

}

