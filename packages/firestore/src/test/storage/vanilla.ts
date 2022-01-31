import {User} from '../index';
import * as should from 'should';
import {BaseRepository} from "../../lib";
import {MemoryStorage} from "firestore-storage-core";

describe('Usage without Inversify (MemoryStorage only)', function () {

	it('should create a repository without DI', async () => {

		class UserRepository extends BaseRepository<User> {

			constructor() {
				super(new MemoryStorage());
			}

			getCollectionPath(...documentIds: string[]): string {
				return 'users';
			}
		}

		const repo = new UserRepository();
		const user = await repo.save({name: ''});

		should(user).property('id');

	});


});
