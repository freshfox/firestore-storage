import {TestFactory} from "../../index";
import {BaseModelClass} from "firestore-storage-core";
import {CollectionUtils, ModelClassTransformer, Repository} from "firestore-storage-core";
import {BaseRepository} from "../../../lib";
import * as should from 'should';

class User extends BaseModelClass<User> {
	username?: string;
	signedUpAt?: Date;
	userGroup?: string;
}

@Repository({
	path: CollectionUtils.createPath('/users/{userId}'),
	transformer: new ModelClassTransformer(User)
})
class UserRepository extends BaseRepository<User> {

}

describe('Model classes', function () {

	const tc = TestFactory.createWithRepository(this, UserRepository, false);
	const userRepo = tc.resolve(UserRepository);

	describe('#save()', function () {
		it('should save an object and return an class instance', async () => {

			const user = await userRepo.save({
				username: 'username',
				signedUpAt: new Date(),
			});
			user.should.instanceOf(User);
		});

		it('should save an class and return a new instance', async () => {
			const user = new User({});
			const user2 = await userRepo.save(user);

			user2.should.instanceOf(User);
			user2.id.should.type('string');
			should(user.id).undefined();
		});
	});

	describe('#findById()', function () {

		it('should return null when document doesn\'t exist', async () => {
			await userRepo.findById('some-non-existing-user').should.resolvedWith(null);
		});

		it('should find user by id ', async () => {
			const date = new Date();
			let user1 = await userRepo.save({
				username: 'username',
				signedUpAt: date
			});
			user1 = await userRepo.findById(user1.id);
			user1.should.instanceOf(User);
			user1.signedUpAt.should.eql(date);
		});

	});

	describe('#list()', function () {

		it('should list multiple documents', async () => {
			const count = 10;
			const ms = Date.now();
			const group = 'userGroup-' + ms;
			for (let i = 0; i < count; i++) {
				await userRepo.save({
					userGroup: group
				});
			}
			const users = await userRepo.list({
				userGroup: group
			});
			users.should.length(10);
			users[0].should.instanceOf(User);
		});

	});

});
