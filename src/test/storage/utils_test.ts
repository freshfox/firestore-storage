import {parseFirestoreChange, parseFirestoreSnapshot} from "../../lib/storage/utils";
import * as _firebaseFunctionsTest from 'firebase-functions-test';
import {BaseModel} from '../../lib/storage/base_model';
import * as admin from "firebase-admin";
import QueryDocumentSnapshot = admin.firestore.QueryDocumentSnapshot;
const firebaseTest = _firebaseFunctionsTest();
import * as should from 'should';

describe('Utils', function () {

	interface User extends BaseModel {
		email: string;
	}

	const accountId = 'acc-id';
	const userId = 'usr-id';
	const path = `accounts/${accountId}/users/${userId}`;

	const email1 = 'test1@example.com';
	const email2 = 'test2@example.com';

	const s1: QueryDocumentSnapshot<User> = firebaseTest.firestore.makeDocumentSnapshot({email: email1}, path);
	const s2: QueryDocumentSnapshot<User> = firebaseTest.firestore.makeDocumentSnapshot({email: email2}, path);
	const change = firebaseTest.makeChange<QueryDocumentSnapshot<User>>(s1, s2);

	const context = {
		params: {accountId, userId},
	} as any;

	describe('#parseFirestoreChange', function () {

		it('should parse change with ids', async () => {

			const result = parseFirestoreChange(change, context, 'accountId', 'userId');

			should(result.before.id).eql(userId);
			should(result.before.email).eql(email1);

			should(result.after.id).eql(userId);
			should(result.after.email).eql(email2);

			should(result.ids.accountId).eql(accountId);
			should(result.ids.userId).eql(userId);
		});

		it('should parse change when document has been created', async () => {

			const change = firebaseTest.makeChange(null, s1);
			const result = parseFirestoreChange(change, {
				params: {accountId, userId},
			} as any, 'accountId', 'userId');

			should(result.before).null();
			should(result.after.id).eql(userId);

		});

		it('should parse change when document has been deleted', async () => {

			const change = firebaseTest.makeChange(s1, null);
			const result = parseFirestoreChange(change, context, 'accountId', 'userId');

			should(result.before.id).eql(userId);
			should(result.after).null();

		});

	});

	describe('#parseFirestoreSnapshot()', function () {
		it('should parse a snapshot', async () => {
			const {data, ids} = parseFirestoreSnapshot(s1, context, 'accountId', 'userId');
			should(data.email).eql(email1);
			should(ids.accountId).eql(accountId);
			should(ids.userId).eql(userId);
		});
	});
});
