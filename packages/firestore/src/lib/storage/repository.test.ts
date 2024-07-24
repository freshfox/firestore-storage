import 'should';
import { FirestoreStorageError } from 'firestore-storage-core';
import { AccountId, AccountRepository, ModelRepository, UserRepository } from './definitions.test';
import { createFirestoreTests } from './test-utils';

describe('Repository', function () {
	let modelRepo: ModelRepository;
	let accountRepo: AccountRepository;
	let userRepo: UserRepository;

	createFirestoreTests(this, (firestore) => {
		modelRepo = new ModelRepository(firestore);
		userRepo = new UserRepository(firestore);
		accountRepo = new AccountRepository(firestore);
	});

	describe('#findById()', function () {
		it('should return null for non existing document', async () => {
			await accountRepo.findById({ accountId: 'acc' as AccountId }).should.resolvedWith(null);
		});

		it('should return document', async () => {
			const acc = await accountRepo.save({ name: 'acc' });
			await accountRepo.findById({ accountId: acc.id }).should.resolvedWith(acc);
		});
	});

	describe('#getById()', function () {
		it('should throw a FirestoreStorageError when a document was not found ', async () => {
			const err = await accountRepo.getById({ accountId: 'acc' as AccountId }).should.rejected();
			err.should.instanceof(FirestoreStorageError);
		});
	});

	describe('#findAll()', function () {
		it('should find a set of documents', async () => {
			const ids = {
				accountId: 'acc1' as AccountId,
			};
			const u1 = await userRepo.save({ userName: 'U1' }, ids);
			const u2 = await userRepo.save({ userName: 'U2' }, ids);

			const users = await userRepo.findAll([u1.id, u2.id], ids);
			users.should.eql([u1, u2]);
		});

		it("should return null if a document doesn't exist", async () => {
			const accounts = await accountRepo.findAll(['id']);
			accounts.should.eql([null]);
		});
	});

	describe('#query()', function () {
		it('should query documents based on sub-field', async () => {
			const ids = {
				accountId: 'acc1' as AccountId,
			};

			const u1 = await userRepo.save({ userName: 'u1', address: { city: 'Vienna' } }, ids);
			const u2 = await userRepo.save({ userName: 'u2', address: { city: 'Vienna' } }, ids);
			const u3 = await userRepo.save({ userName: 'u3', address: { city: 'Berlin' } }, ids);

			const users = await userRepo.query((qb) => {
				return qb.where((u) => u.address.city, '==', 'Vienna');
			}, ids);

			users.should.length(2);
			users.find((u) => u.id === u1.id).should.not.undefined();
			users.find((u) => u.id === u2.id).should.not.undefined();
		});
	});

	describe('#save()', function () {
		it('should save a document', async () => {
			const account = await accountRepo.save({
				name: 'acc',
			});
			account.name.should.eql('acc');
			account.id.should.type('string').not.empty();
		});

		it('should update an existing document', async () => {
			const account = await accountRepo.save({
				name: 'acc',
			});

			await accountRepo.save({
				id: account.id,
				name: 'acc2',
			});
			const accounts = await accountRepo.list(null);

			accounts.should.length(1);
			accounts[0].name.should.eql('acc2');
		});
	});

	describe('#write()', function () {
		it('should save a document without merging data', async () => {
			const ids = { accountId: 'acc' as AccountId };
			const u1 = await userRepo.write(
				{
					userName: 'john',
					address: { city: 'Vienna' },
				},
				ids
			);
			const u2 = await userRepo.write(
				{
					id: u1.id,
					userName: 'john2',
				},
				ids
			);

			u2.should.property('id', u1.id);
			u2.should.property('userName', 'john2');
			u2.should.not.property('address');
		});
	});

	describe('#update()', function () {
		it('should throw an error when trying to update a document', async () => {
			const err = await accountRepo.update({ id: 'acc' as AccountId, name: 'acc' }).should.rejected();
			err.should.instanceof(FirestoreStorageError);
		});

		it('should successfully update an existing document', async () => {
			let acc = await accountRepo.save({ name: 'acc' });
			acc = await accountRepo.update({
				id: acc.id,
				name: 'acc2',
			});
			acc.should.property('name', 'acc2');
		});

		it('should check for 1 level merge', async () => {
			const accountId = 'acc1' as AccountId;
			let user = await userRepo.create({ userName: 'name' }, { accountId });
			user = await userRepo.update(
				{
					id: user.id,
					address: {
						street: 'street',
					},
				},
				{ accountId }
			);
			user.should.eql({
				id: user.id,
				userName: 'name',
				address: {
					street: 'street',
				},
				_rawPath: user._rawPath,
			});
		});

		it('should check for 2 level merge', async () => {
			const accountId = 'acc1' as AccountId;
			let user = await userRepo.create(
				{
					userName: 'name',
					address: {
						street: 'street',
					},
				},
				{ accountId }
			);
			user = await userRepo.update(
				{
					id: user.id,
					address: {
						city: 'Vienna',
					},
				},
				{ accountId }
			);
			user.should.eql({
				id: user.id,
				userName: 'name',
				address: {
					city: 'Vienna',
				},
				_rawPath: user._rawPath,
			});
		});
	});
});
