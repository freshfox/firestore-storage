import {CollectionUtils} from "../lib";

describe('CollectionUtils', function () {

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

	describe('#replacePathSegments()', function () {
		it('should replace path segments', async () => {

			CollectionUtils.replacePathSegments('workoutPrograms/{programId}').should.eql('workoutPrograms');
			CollectionUtils.replacePathSegments('workoutPrograms/{programId}', 'id').should.eql('workoutPrograms/id');
			CollectionUtils.replacePathSegments('workoutPrograms/{programId}/workouts/{workoutId}', 'id1').should.eql('workoutPrograms/id1/workouts');
			CollectionUtils.replacePathSegments('workoutPrograms/{programId}/workouts/{workoutId}', 'id1', 'id2').should.eql('workoutPrograms/id1/workouts/id2');
		});
	});

});
