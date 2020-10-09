import * as firebase from "@firebase/testing";
import * as fs from "fs";
import * as FirestoreEmulator from 'firebase-tools/lib/emulator/firestoreEmulator';

interface AuthInfo {
	uid: string;
	email?: string
}

interface IFirestoreRuleTestConfig {
	projectId: string
}

export class FirestoreRuleTest {

	private static readonly EMULATOR = new FirestoreEmulator.FirestoreEmulator({
		auto_download: true
	});

	readonly projectId = 'firestore-test-' + Date.now();
	readonly firestore: firebase.firestore.Firestore;
	readonly admin: firebase.firestore.Firestore;
	private readonly auth: AuthInfo;

	constructor(auth?: AuthInfo, config?: IFirestoreRuleTestConfig);
	constructor(auth?: string,config?: IFirestoreRuleTestConfig);
	constructor(auth?: AuthInfo | string, config?: IFirestoreRuleTestConfig) {
		if (typeof auth === 'string') {
			this.auth = {
				uid: auth
			}
		} else {
			this.auth = auth;
		}
		if (config?.projectId) {
			this.projectId = config.projectId;
		}
		this.firestore = firebase
			.initializeTestApp({
				projectId: this.projectId,
				auth: this.auth
			})
			.firestore();
		this.admin = firebase
			.initializeAdminApp({
				projectId: this.projectId
			}).firestore();
	}

	async loadRules(pathToRules: string) {
		const rules = fs.readFileSync(pathToRules, 'utf8');
		await firebase.loadFirestoreRules({projectId: this.projectId, rules});
	}

	clearFirestoreData() {
		return firebase.clearFirestoreData({
			projectId: this.projectId
		});
	}

	static deleteApps() {
		return Promise.all(firebase.apps().map(app => app.delete()));
	}

	static async start() {
		await FirestoreRuleTest.EMULATOR.start();
		console.log('Starting local Firestore Emulator', FirestoreRuleTest.EMULATOR.getInfo());
		await FirestoreRuleTest.wait(3000);
	}

	static async stop() {
		try {
			await FirestoreRuleTest.EMULATOR.stop();
		} catch (ignored) {}
		await FirestoreRuleTest.wait(1000);
		console.log('Stopped local Firestore Emulator');
		await this.deleteApps();
	}

	private static wait(ms: number) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}
