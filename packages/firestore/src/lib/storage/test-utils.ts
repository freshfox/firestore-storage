import * as env from 'node-env-file';
import * as fs from 'fs';
import { Firestore } from '@google-cloud/firestore';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';

const path = __dirname + '/../../../.env';
if (fs.existsSync(path)) {
	env(path);
}

export function createFirestoreTests(context: Mocha.Suite, setup: (firestore: Firestore) => any) {
	let app: RulesTestEnvironment;

	context.beforeEach(async () => {
		app = await initializeTestEnvironment({
			projectId: 'firestore-storage-local',
			firestore: {
				host: '127.0.0.1',
				port: 8080,
			},
		});
		await app.clearFirestore();
		const firestore = new Firestore({
			projectId: app.projectId,
			host: app.emulators.firestore.host,
			port: app.emulators.firestore.port,
			ssl: false,
		});
		await setup(firestore);
	});

	context.afterEach(async () => {
		if (app) {
			await app.cleanup();
		}
	});
}
