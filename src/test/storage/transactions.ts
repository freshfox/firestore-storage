import {TestFactory, User, UserRepository} from '../index';
import * as should from 'should';

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
			jane.last_login = new Date();
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

		const u2 = await userRepo.save({last_login: new Date('2019-06-02')});
		const u6 = await userRepo.save({last_login: new Date('2019-06-06')});
		const u1 = await userRepo.save({last_login: new Date('2019-06-01')});
		const u3 = await userRepo.save({last_login: new Date('2019-06-03')});
		const u4 = await userRepo.save({last_login: new Date('2019-06-04')});
		const u5 = await userRepo.save({last_login: new Date('2019-06-05')});

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

});
