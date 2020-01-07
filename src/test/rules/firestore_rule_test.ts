import * as firebase from "@firebase/testing";
import * as fs from "fs";
import {start, stop} from 'firebase-tools/lib/serve/firestore';

export class FirestoreRuleTest {

	readonly projectId = 'firestore-test-' + Date.now();

	readonly firestore: firebase.firestore.Firestore;

	constructor(uid?: string) {
		const auth = uid ? {uid} : null;
		this.firestore = firebase
			.initializeTestApp({
				projectId: this.projectId,
				auth
			})
			.firestore();
	}

	async loadRules(pathToRules: string) {
		const rules = fs.readFileSync(pathToRules, 'utf8');
		await firebase.loadFirestoreRules({projectId: this.projectId, rules});
	}

	static async start() {
		await start();
		console.log('Starting local Firestore Emulator');
		await FirestoreRuleTest.wait(3000);
	}

	static async stop() {
		try {
			await stop();
		} catch (ignored) {}
		await FirestoreRuleTest.wait(1000);
		console.log('Stopped local Firestore Emulator');
		await Promise.all(firebase.apps().map(app => app.delete()));
	}

	private static wait(ms: number) {
		return new Promise((resolve) => {
			setTimeout(resolve, ms);
		});
	}
}
