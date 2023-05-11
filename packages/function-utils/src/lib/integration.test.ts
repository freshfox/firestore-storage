import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { parseFirestoreChange, parseFirestoreCreate } from './utils';
import { CollectionPath } from 'firestore-storage-core';
import 'should';
import * as functionTest from 'firebase-functions-test';

describe('Functions', function () {
	const Users = new CollectionPath('users', 'userId');
	const app = functionTest({
		projectId: 'demo-functions',
	});
	const path = Users.doc({ userId: 'u1' });

	// Make snapshot for state of database beforehand
	const beforeSnap = app.firestore.makeDocumentSnapshot({ foo: 'bar' }, path);
	// Make snapshot for state of database after the change
	const afterSnap = app.firestore.makeDocumentSnapshot({ foo: 'faz' }, path);

	it('should check return type of create function', async () => {
		const fn = onDocumentCreated(Users.path(), (event) => {
			return parseFirestoreCreate(event, Users);
		});

		// Call wrapped function with the Change object
		const wrapped = app.wrap(fn);
		const result = wrapped(beforeSnap);
		result.should.properties('ids', 'data');
	});

	it('should check return type of update function', async () => {
		const fn = onDocumentWritten(Users.path(), (event) => {
			return parseFirestoreChange(event, Users);
		});
		const change = app.makeChange(beforeSnap, afterSnap);
		// Call wrapped function with the Change object
		const wrapped = app.wrap(fn);
		const result = wrapped(change);
		result.should.properties('ids', 'before', 'after');
	});
});
