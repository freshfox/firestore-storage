import * as should from 'should';
import {Guest, GuestRepository, TestFactory} from '../index';
import {OrderDirection} from '../../lib';

describe('GuestRepository', function () {

	const accountId = 'account-' + Date.now();
	const tc = TestFactory.createWithRepository(this, GuestRepository, null, false, accountId);
	const guestRepo = tc.resolve(GuestRepository);

	const has = (guests: Guest[], id: string) => {
		should(guests.find((guest) => {
			return guest.id === id;
		})).not.null();
	};

	it('should not find a document if it doesn\'t exist', async () => {

		const guest = await guestRepo.findById(accountId, 'non-existing');
		should(guest).null();

	});

	it('should #save() and #findById() a guest', async () => {

		const guest = await guestRepo.save({
			firstname: 'firstname',
			lastname: 'lastname'
		}, accountId);
		should(guest).property('id').not.null();

		const guest2 = await guestRepo.findById(accountId, guest.id);

		should(guest2).property('firstname', 'firstname');

	});

	it('should #save() and #list() guests', async () => {

		const guest1 = await guestRepo.save({
			firstname: '1',
			lastname: '1'
		}, accountId);

		const guest2 = await guestRepo.save({
			firstname: '2',
			lastname: '2'
		}, accountId);

		const guests = await guestRepo.list(null, accountId);
		should(guests).length(2);

		has(guests, guest1.id);
		has(guests, guest2.id);

	});

	it('should #find() by attributes', async () => {

		const names = ['n1', 'n2', 'n3'];

		await Promise.all(names.map((name) => {
			return guestRepo.save({
				firstname: name
			}, accountId);
		}));

		const guest = await guestRepo.find({
			firstname: 'n2'
		}, accountId);

		should(guest).property('firstname', 'n2')
	});

	it('should #list() guests by attributes', async () => {

		const names = ['n1', 'n1', 'n1', 'n2', 'n3'];

		await Promise.all(names.map((name) => {
			return guestRepo.save({
				firstname: name
			}, accountId);
		}));

		const allGuests = await guestRepo.list(null, accountId);
		should(allGuests).length(names.length);

		const n1 = await guestRepo.list({
			firstname: 'n1'
		}, accountId);
		should(n1).length(3);

		const n2 = await guestRepo.list({
			firstname: 'n2'
		}, accountId);
		should(n2).length(1);

	});

	it('should #save() and #batchGet() guests', async () => {

		const names = ['n1', 'n2', 'n3', 'n4', 'n5'];

		const guests = await Promise.all(names.map((name) => {
			return guestRepo.save({
				firstname: name
			}, accountId);
		}));

		const someGuests = await guestRepo.batchGet([
			guests[0].id,
			guests[4].id,
		], accountId);

		should(someGuests).length(2);

		has(someGuests, guests[0].id);
		has(someGuests, guests[4].id);

		const withNulls = await guestRepo.batchGet([
			guests[0].id,
			'other'
		], accountId);
		should(withNulls).length(2);

		has(withNulls, guests[0].id);
		should(withNulls[1]).null();

	});

	it('should #save() a guest and add createdAt and updatedAt timestamps', async () => {

		const guest = await guestRepo.save({}, accountId);

		should(guest.createdAt.getTime()).not.eql(0);
		should(guest.updatedAt.getTime()).not.eql(0);

		should(guest.createdAt.getTime()).eql(guest.updatedAt.getTime());

	});

	it('should #save() and update a guest and update the updatedAt timestamp', async () => {

		const wait = (ms) => {
			return new Promise((resolve) => {
				setTimeout(resolve, ms)
			})
		};

		const guest1 = await guestRepo.save({}, accountId);

		guest1.firstname = 'n1';

		// Wait a bit since MemoryStorage is kind of fast
		await wait(110);

		const guest2 = await guestRepo.save(guest1, accountId);

		should(guest1.createdAt.getTime()).eql(guest2.createdAt.getTime());
		should(guest2.updatedAt.getTime()).greaterThan(guest2.createdAt.getTime());

		should(guest2.updatedAt.getTime() - guest2.createdAt.getTime()).greaterThanOrEqual(100);

	});

	it('should #save() and #delete() a guest', async () => {

		const guest1 = await guestRepo.save({ firstname: 'n1' }, accountId);
		const guest2 = await guestRepo.save({ firstname: 'n2' }, accountId);

		await guestRepo.delete(accountId, guest1.id);

		const guests = await guestRepo.list(null, accountId);
		should(guests).length(1);
		should(guests[0]).property('id', guest2.id);

	});

	it('should save a guest and check if data was merged', async () => {

		let g1 = await guestRepo.save({
			meta: {
				test1: true
			}
		} as any, accountId);

		g1 = await guestRepo.save({
			id: g1.id,
			firstname: 'John',
			meta: {
				test2: true
			}
		} as any, accountId);

		should(g1).properties({
			id: g1.id,
			firstname: 'John',
			meta: {
				test1: true,
				test2: true
			}
		});
	});

	describe('#orderBy()', function () {

		const save = (firstname: string) => {
			return  guestRepo.save({
				firstname: firstname,

			}, accountId);
		};

		const query = async (direction?: OrderDirection) => {
			const results = await guestRepo.query((qb) => {
				return qb.orderBy('firstname', direction)
			}, accountId);
			return results.map((guest) => {
				return guest.firstname;
			})
		};

		beforeEach(async () => {
			await save('A');
			await save('B');
			await save('A');
			await save('a');
			await save('b');
			await save('Z');
		});

		it('should list ordered by name with default direction', async () => {

			const guestNames = await query();
			should(guestNames).eql([
				'A', 'A', 'B', 'Z', 'a', 'b'
			]);

		});

		it('should list ordered by name with ascending direction', async () => {

			const guestNames = await query('asc');
			should(guestNames).eql([
				'A', 'A', 'B', 'Z', 'a', 'b'
			]);

		});

		it('should list ordered by name with descending direction', async () => {

			const guestNames = await query('desc');
			should(guestNames).eql([
				'b', 'a', 'Z', 'B', 'A', 'A',
			]);

		});

	});


});
