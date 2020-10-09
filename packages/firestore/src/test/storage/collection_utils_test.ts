import 'should';
import {CollectionUtils} from "../../lib/storage/collection_utils";

describe('Collection Paths', function () {

	it('should generate a path', function () {

		const Restaurants_Reviews = CollectionUtils.createPath('restaurants/{resId}/reviews/{reviewId}');

		const collectionPath = Restaurants_Reviews('starbucks');
		console.log(collectionPath);

		const docPath = Restaurants_Reviews('starbucks', 'review123');
		console.log(docPath);

	});

	it('should replace path segments', async () => {

		CollectionUtils.replacePathSegments('workoutPrograms/{programId}').should.eql('workoutPrograms');
		CollectionUtils.replacePathSegments('workoutPrograms/{programId}', 'id').should.eql('workoutPrograms/id');
		CollectionUtils.replacePathSegments('workoutPrograms/{programId}/workouts/{workoutId}', 'id1').should.eql('workoutPrograms/id1/workouts');
		CollectionUtils.replacePathSegments('workoutPrograms/{programId}/workouts/{workoutId}', 'id1', 'id2').should.eql('workoutPrograms/id1/workouts/id2');
	});

	describe('#createPath()', function () {
		it('should check collectionGroup on a path on a root level collection', async () => {
			CollectionUtils.createPath('/users/{userId}').collectionGroup.should.eql('users');
		});

		it('should check collectionGroup on a path on a first level collection', async () => {
			CollectionUtils.createPath('/users/{userId}/posts/{postId}').collectionGroup.should.eql('posts');
		});

		it('should check collectionGroup on a path on a second level collection', async () => {
			CollectionUtils.createPath('/users/{userId}/posts/{postId}/comments/{commentId}').collectionGroup.should.eql('comments');
		});
	});

});
