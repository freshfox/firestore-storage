import * as should from 'should';
import { CollectionPath, DocumentIds } from './collections';

describe('CollectionPath', function () {
	const Accounts = new CollectionPath('accounts', 'accountId');
	const Users = new CollectionPath<'userId', string, DocumentIds<typeof Accounts>>('users', 'userId', Accounts);

	it('should generate a path template', async () => {
		Users.path().should.eql('/accounts/{accountId}/users/{userId}');
	});

	it('should generate a collection path', async () => {
		Users.collection({ accountId: '1' }).should.eql('/accounts/1/users');
	});

	it('should generate a document path', async () => {
		Users.doc({ accountId: '1', userId: '2' }).should.eql('/accounts/1/users/2');
	});

	it('should generate a map of document ids', async () => {
		Users.toDocIds({ accountId: '1' }, '2').should.eql({
			accountId: '1',
			userId: '2',
		});
	});

	it('should get collection name', async () => {
		Users.collectionName.should.eql('users');
	});

	it('should parse a path and extract ids', async () => {
		Users.parse('/accounts/1/users/2').should.eql({
			accountId: '1',
			userId: '2',
		});
	});

	it('should fail to parse wrong paths', async () => {
		should(() => Users.parse('/accounts/1/users/')).throw();
		should(() => Users.parse('/accounts/1/')).throw();
		should(() => Users.parse('/users/1')).throw();
	});
});
