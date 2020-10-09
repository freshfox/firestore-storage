import {FirestoreRuleTest} from "./firestore_rule_test";
import {getFirestoreTestPath} from "../index";
import * as should from 'should';

describe('Emulator', function () {

	this.timeout(2 * 60 * 1000)

	it('should start and stop the emulator', async () => {

		await FirestoreRuleTest.start();

		const tc = new FirestoreRuleTest('userId');
		await tc.firestore.doc(getFirestoreTestPath()).set({
			test: 123123
		});
		const data = await tc.firestore.doc(getFirestoreTestPath()).get();

		should(data.data()).property('test', 123123);
		await FirestoreRuleTest.stop();

	});

});
