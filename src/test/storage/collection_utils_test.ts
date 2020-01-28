import 'should';
import {CollectionUtils} from "../../lib/storage/collection_utils";

describe('Collection Paths', function () {

	it('should replace path segments', async () => {

		CollectionUtils.replacePathSegments('workoutPrograms/{programId}').should.eql('workoutPrograms');
		CollectionUtils.replacePathSegments('workoutPrograms/{programId}', 'id').should.eql('workoutPrograms/id');
		CollectionUtils.replacePathSegments('workoutPrograms/{programId}/workouts/{workoutId}', 'id1').should.eql('workoutPrograms/id1/workouts');
		CollectionUtils.replacePathSegments('workoutPrograms/{programId}/workouts/{workoutId}', 'id1', 'id2').should.eql('workoutPrograms/id1/workouts/id2');
	});

});
