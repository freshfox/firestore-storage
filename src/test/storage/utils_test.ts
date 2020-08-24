import {parseFirestoreChange} from "../../lib/storage/utils";
import * as _firebaseFunctionsTest from 'firebase-functions-test';
import {BaseModel} from '../../lib/storage/base_model';
import * as admin from "firebase-admin";
import QueryDocumentSnapshot = admin.firestore.QueryDocumentSnapshot;
const firebaseTest = _firebaseFunctionsTest();
import * as should from 'should';

describe('Utils', function () {

	describe('#parseFirestoreChange', function () {

		interface User extends BaseModel {
			email: string;
		}

		const accountId = 'acc-id';
		const userId = 'usr-id';
		const path = `accounts/${accountId}/users/${userId}`;

		const email1 = 'test1@example.com';
		const email2 = 'test2@example.com';

		const s1 = firebaseTest.firestore.makeDocumentSnapshot({email: email1}, path);
		const s2 = firebaseTest.firestore.makeDocumentSnapshot({email: email2}, path);
		const change = firebaseTest.makeChange<QueryDocumentSnapshot<User>>(s1, s2);

		it('should parse change with ids', async () => {

			const result = parseFirestoreChange(change, {
				params: {accountId, userId},
			} as any, 'accountId', 'userId');

			should(result.before.id).eql(userId);
			should(result.before.email).eql(email1);

			should(result.after.id).eql(userId);
			should(result.after.email).eql(email2);

			should(result.ids.accountId).eql(accountId);
			should(result.ids.userId).eql(userId);
		});

	});
});
