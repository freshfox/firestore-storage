import {TestFactory, User, UserRepository} from '../index';
import * as should from 'should';

describe('Error throwing', function () {

	class CustomError extends Error {}

	describe('with default error factory', function () {

		const tc = TestFactory.createWithRepository(this, UserRepository);
		const userRepo = tc.resolve(UserRepository);

		it('error should be rejected with the default error class', async () => {
			const p1 = userRepo.getById('none');
			await should(p1).rejectedWith(Error);
		});

	});

	describe('with custom error factory', function () {

		const tc = TestFactory.createWithRepository(this, UserRepository, (msg) => {
			return new CustomError(msg);
		});
		const userRepo = tc.resolve(UserRepository);

		it('error should be rejected with the custom error class', async () => {
			const p1 = userRepo.getById('none');
			await should(p1).rejectedWith(CustomError);
		});

	});

});
