import * as _firebaseFunctionsTest from 'firebase-functions-test';
import * as admin from "firebase-admin";
import * as should from 'should';
import {BaseModel, DocumentChange} from "firestore-storage-core";
import QueryDocumentSnapshot = admin.firestore.QueryDocumentSnapshot;
import {parseFirestoreChangeValue} from "../lib";
const firebaseTest = _firebaseFunctionsTest();

describe('Utils', function () {

	interface User extends BaseModel {
		email: string;
		address?: {
			street: string,
			city: string;
		}
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

			const result = parseFirestoreChangeValue(change, context, 'accountId', 'userId');

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

	describe('DocumentChange', function () {

		function u(id: string, email: string, address?: {street: string, city: string}): User {
			return {
				id, email, address
			};
		}

		it('should set changeKeys to empty array when nothing changes', async () => {
			const change = new DocumentChange({
				before: u('id1', 'test1@example.com', {street: 'Street1', city: 'Vienna'}),
				after: u('id1', 'test1@example.com', {street: 'Street1', city: 'Vienna'}),
				ids: {}
			});
			should(change.changedKeys).eql([]);
			should(change.hasChanged('address', 'email')).false();
		});

		it('should set changedKeys when only primitive values change', async () => {
			const change = new DocumentChange({
				before: u('id1', 'test1@example.com', {street: 'Street1', city: 'Vienna'}),
				after: u('id1', 'test2@example.com', {street: 'Street1', city: 'Vienna'}),
				ids: {}
			});
			should(change.changedKeys).eql(['email'])
			should(change.hasChanged('address', 'email')).true();
			should(change.hasChanged('address')).false();
			should(change.hasChanged('email')).true();
		});

		it('should set changedKeys when an root level object value changes', async () => {
			const change = new DocumentChange({
				before: u('id1', 'test1@example.com', {street: 'Street1', city: 'Vienna'}),
				after: u('id1', 'test1@example.com', {street: 'Street2', city: 'Vienna'}),
				ids: {}
			});
			should(change.changedKeys).eql(['address']);
			should(change.hasChanged('address', 'email')).true();
			should(change.hasChanged('address')).true();
			should(change.hasChanged('email')).false();
		});

	});
});
