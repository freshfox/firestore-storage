import {TestFactory} from '../index';
import {BaseModel} from '../../lib/storage/base_model';
import {BaseRepository} from '../../lib/storage/base_repository';
import * as should from 'should';

interface User extends BaseModel {

	name?: string;
	email?: string;

}

class UserRepository extends BaseRepository<User> {

	getCollectionPath(...documentIds: string[]): string {
		return 'users';
	}

}

describe('UserRepository', function () {

	const tc = TestFactory.createWithRepository(UserRepository);
	const userRepo = tc.resolve(UserRepository);

	it('should save a user', async () => {

		const user = await userRepo.save({
			name: 'Test User'
		});
		should(user.id).type('string');
		should(user.createdAt).instanceOf(Date);
		should(user.updatedAt).instanceOf(Date);

	});


});
