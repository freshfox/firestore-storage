import {TestFactory, User, UserRepository} from '../index';
import * as should from 'should';
import * as admin from "firebase-admin";
import Timestamp = admin.firestore.Timestamp;

describe('UserRepository', function () {

	const tc = TestFactory.createWithRepository(this, UserRepository);
	const userRepo = tc.resolve(UserRepository);

	beforeEach(async () => {
		return userRepo.clear();
	});

	const save = async (count: number, cb?: (index: number) => User) => {
		for (let i = 0; i < count; i++) {
			await userRepo.save(cb ? cb(i) : {
				name: 'u' + i
			});
		}
	};

	it('should save a user', async () => {

		const user = await userRepo.save({
			name: 'Test User'
		});
		should(user.id).type('string');
		should(user.createdAt).instanceOf(Date);
		should(user.updatedAt).instanceOf(Date);

	});

	it('should save multiple users and list them', async () => {

		let count = 10;
		await save(count);
		const users = await userRepo.list();
		should(users).length(count);

	});

	it('should query by name', async () => {

		await save(3);
		const users = await userRepo.list({
			name: 'u2'
		});
		should(users).length(1);
	});

	it('should find a user by id', async () => {

		await userRepo.save({name: 'u1'});
		await userRepo.save({name: 'u2'});
		const u1 = await userRepo.save({name: 'u3'});
		await userRepo.save({name: 'u4'});

		const user = await userRepo.findById(u1.id);


		should(user.id).eql(u1.id);
		should(user.name).eql('u3');

	});

	it('should query by date', async () => {

		const start = new Date('2018-03-10');
		await save(10, (index) => {
			start.setDate(start.getDate() + 1);
			return {
				name: 'n' + index,
				last_login: Timestamp.fromDate(start)
			}
		});

		let queryDate = new Date('2018-03-14');
		const users = await userRepo.query((qb) => {
			return qb.where('last_login', '>', queryDate);
		});

		should(users).length(6);
		for (let i = 0; i < users.length; i++) {
			const user = users[i];
			should(user.last_login.toDate().getTime() > queryDate.getTime()).true();
		}

	});

	it('should get an user by id and throw an error', async () => {

		// @ts-ignore
		await userRepo.getById('asd').should.be.rejected();

	});

	it('should get an user by id', async () => {

		const u1 = await userRepo.save({
			name: 'test'
		});
		await userRepo.getById(u1.id).should.fulfilledWith(u1);
	});

	it('should query with data from a sub map', async () => {

		const u1 = await userRepo.save({
			address: {
				street: 'Some Street',
				postal: 1234,
				city: 'City'
			}
		});

		const u2 = await userRepo.save({
			address: {
				street: 'Some Street',
				postal: 5678,
				city: 'City'
			}
		});

		const users = await userRepo.query((qb) => {
			return qb.where('address.postal', '==', 1234);
		});

		should(users).length(1);
		should(users[0]).property('id', u1.id);

	});

	it('should batchGet() documents', async () => {

		const u1 = await userRepo.save({});
		const u2 = await userRepo.save({});
		const u3 = await userRepo.save({});

		const users1 = await userRepo.findAll([u3.id, 'something', u1.id]);
		should(users1).length(3);
		should(users1[0]).property('id', u3.id);
		should(users1[1]).eql(null);
		should(users1[2]).property('id', u1.id);

	});

	it('should batchGet() documents without nulls', async () => {

		const u1 = await userRepo.save({});
		const u2 = await userRepo.save({});
		const u3 = await userRepo.save({});

		const users1 = await userRepo.getAll([u3.id, 'something', u1.id]);
		should(users1).length(2);
		should(users1[0]).property('id', u3.id);
		should(users1[1]).property('id', u1.id);

	});

	it('should save a document using default merge strategy', async () => {

		const u1 = await userRepo.save({
			lastname: 'Doe'
		});

		const u2 = await userRepo.save({
			id: u1.id,
			firstname: 'John'
		});

		should(u2).properties({
			firstname: 'John',
			lastname: 'Doe'
		})

	});

	it('should save a document without merging data', async () => {

		const u1 = await userRepo.save({
			lastname: 'Doe'
		});

		const u2 = await userRepo.write({
			id: u1.id,
			firstname: 'John'
		});

		should(u2).properties({
			id: u1.id,
			firstname: 'John'
		});
		should(u2).not.property('lastname');

	});


});
