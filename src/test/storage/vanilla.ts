import {BaseRepository} from '../../lib/storage/base_repository';
import {User} from '../index';
import {MemoryStorage} from '../../lib/storage/memory_storage';
import * as should from 'should';

describe('Usage without Inversify', function () {

	it('should create a repository without DI', async () => {

		class UserRepository extends BaseRepository<User> {

			constructor() {
				super(new MemoryStorage(), (msg) => {
					return new Error(msg)
				});
			}

			getCollectionPath(...documentIds: string[]): string {
				return 'users';
			}
		}

		const repo = new UserRepository();
		const user = await repo.save({});

		should(user).property('id');

	});


});
