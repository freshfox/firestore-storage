import {exportFirestore} from "../../lib";

describe('Export', function () {

	it('should export data', async () => {

		return exportFirestore('firestore-storage-test', 'firestore-storage-test.appspot.com', 'backup/2020-07-23')

	});

});
