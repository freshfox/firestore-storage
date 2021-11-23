import * as should from 'should';
import {MemoryStorage} from "../lib";
import {BaseModelClass} from "../lib/storage/base_model_v2";
import {ModelClassTransformer} from "../lib/storage/transformer";

describe('MemoryStorage', function () {

	describe('Models as interfaces', function () {
		it('should save and receive a document', async () => {

			const memoryStorage = new MemoryStorage();

			const account = await memoryStorage.save<any>('accounts', {
				name: 'Test Account'
			});
			should(account).property('id').type('string');
			should(account).property('name', 'Test Account');

			const sameAccount = await memoryStorage.findById('accounts', account.id);
			should(sameAccount).eql(account);

		});

		it('should save and receive a deeply nested object', async () => {

			const memoryStorage = new MemoryStorage();

			const accountId = 'random-id';

			const reservation = await memoryStorage.save<any>(`accounts/${accountId}/reservations`, {
				status: 'booked'
			});

			const account = await memoryStorage.save('accounts', {id: accountId, name: 'Test Account'});
			const account2 = await memoryStorage.findById('accounts', accountId);
			should(account).eql(account2);

			const reservation2 = await memoryStorage.findById(`accounts/${accountId}/reservations`, reservation.id);
			should(reservation).eql(reservation2);

		});

		it('should not merge values in an array', async () => {

			const memoryStorage = new MemoryStorage();
			let m = await memoryStorage.save<any>('test', {
				val1: 1,
				arr: [{e: 1}]
			});
			m = await memoryStorage.save('test', {
				id: m.id,
				val2: 2,
				arr: [{e: 2}]
			});
			should(m).properties({
				val1: 1,
				val2: 2,
				arr: [{e: 2}]
			});
		});
	});

	describe('Models as classes', function () {

		class User extends BaseModelClass<User> {
			username: string;
		}

		const transformer = new ModelClassTransformer(User);

		it('should save a model class from an plain object', async () => {
			const memoryStorage = new MemoryStorage();
			const user = await memoryStorage.save<User>('users', {
				username: 'username'
			}, {
				transformer: transformer
			});
			user.should.instanceOf(User);
			user.username.should.eql('username');
			user.id.should.type('string');
		});

		it('should save a model class', async () => {
			const memoryStorage = new MemoryStorage();
			const user = await memoryStorage.save<User>('users', new User({
				username: 'username'
			}), {
				transformer: transformer
			});
			user.should.instanceOf(User);
			user.username.should.eql('username');
			user.id.should.type('string');
		});

	});

});
