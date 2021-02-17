import {TestFactory, UserRepository} from '../index';
import * as should from 'should';
import * as admin from "firebase-admin";
import Timestamp = admin.firestore.Timestamp;

describe('Transactions', function () {

	const tc = TestFactory.createWithRepository(this, UserRepository, null);
	const userRepo = tc.resolve(UserRepository);

	beforeEach(async () => {
		return userRepo.clear();
	});

	it('should check the return value of a transaction', async () => {

		const result = await userRepo.transaction(async () => {
			return 'done';
		});

		should(result).eql('done');

	});

	it('should create and set data using a transaction', async () => {

		const fakeId = 'fakeId';

		const u1 = await userRepo.save({
			name: 'Jane Doe',
			email: 'jane@example.com'
		});

		await userRepo.transaction(async (trx) => {

			const jane = await trx.get(u1.id);
			jane.last_login = Timestamp.now();
			trx.set(jane);

			trx.create({
				id: fakeId,
				name: 'John Doe',
				email: 'test@example.com',
			});

			return 'done';
		});

		const users = await userRepo.list();
		should(users).length(2);
		const userIds = users.map(u => u.id);
		should(userIds).containEql(u1.id);
		should(userIds).not.containEql(fakeId);
	});

	it('should update data using a transaction', async () => {

		const u2 = await userRepo.save({last_login: Timestamp.fromDate(new Date('2019-06-02'))});
		const u6 = await userRepo.save({last_login: Timestamp.fromDate(new Date('2019-06-06'))});
		const u1 = await userRepo.save({last_login: Timestamp.fromDate(new Date('2019-06-01'))});
		const u3 = await userRepo.save({last_login: Timestamp.fromDate(new Date('2019-06-03'))});
		const u4 = await userRepo.save({last_login: Timestamp.fromDate(new Date('2019-06-04'))});
		const u5 = await userRepo.save({last_login: Timestamp.fromDate(new Date('2019-06-05'))});

		await userRepo.transaction(async (trx) => {

			const users = await trx.query((qb) => {
				return qb.where('last_login', '<', new Date('2019-06-04'))
					.orderBy('last_login', 'asc')
			});

			should(users.map(u => u.id)).eql([u1.id, u2.id, u3.id]);

			u1.last_login = null;
			trx.update(u1);
		});

		const user = await userRepo.findById(u1.id);
		should(user.last_login).null();

	});

	it('should make batch updates in a transaction', async () => {

		let u1 = await userRepo.save({firstname: 'John', last_login: Timestamp.fromDate(new Date('2019-06-02'))});
		await userRepo.transaction(async (trx) => {
			trx.update({
				id: u1.id,
				lastname: 'Doe'
			});
		});

		u1 = await userRepo.findById(u1.id);
		should(u1).properties({
			id: u1.id,
			firstname: 'John',
			lastname: 'Doe'
		});
	});

	it('should make a transaction without merges', async () => {

		let u1 = await userRepo.save({
			firstname: 'John',
			last_login: Timestamp.fromDate(new Date('2019-06-02')),
			address: {
				city: 'Vienna',
				postal: 1234
			}
		});

		await userRepo.transaction(async (trx) => {
			trx.setAvoidMerge({
				id: u1.id,
				firstname: 'John',
				address: {
					city: 'Vienna'
				}
			})
		});

		u1 = await userRepo.findById(u1.id);
		should(u1).eql({
			id: u1.id,
			firstname: 'John',
			address: {
				city: 'Vienna'
			},
			createdAt: u1.createdAt,
			updatedAt: u1.updatedAt,
			_rawPath: u1._rawPath
		});
	});

	it('should query and update nested objects', async () => {

		let u1 = await userRepo.save({
			firstname: 'John',
			address: {
				city: 'Vienna',
				postal: 1234
			}
		});

		await userRepo.transaction(async (trx) => {
			const users = await trx.query((qb) => {
				return qb.where('address.city', '==', 'Vienna');
			});
			for (const user of users) {
				trx.set({
					id: user.id,
					address: {
						city: 'Vienna',
						postal: 1111
					}
				});
			}
		});

		u1 = await userRepo.getById(u1.id);
		should(u1.address).properties({
			city: 'Vienna',
			postal: 1111
		});

	});

});
