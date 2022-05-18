import {User} from '../index';
import * as should from 'should';
import {BaseRepository} from "../../lib";
import {CollectionUtils, MemoryStorage, Repository} from "firestore-storage-core";

describe('Usage without Inversify (MemoryStorage only)', function () {

	it('should create a repository without DI', async () => {

		const path = CollectionUtils.createPath('users/{asdasd}');
		@Repository({path})
		class SomeRepo extends BaseRepository<User> {

			constructor() {
				super(new MemoryStorage());
			}
		}

		const repo = new SomeRepo();
		const user = await repo.save({name: ''});

		should(user).property('id');

	});


});
