import {TestCase} from "../index";

describe('Stream', function () {

	const tc = new TestCase();
	const storage = tc.getStorage();

	it('should stream data', async () => {

		for (let i = 0; i < 10; i++) {
			await storage.save('test', {});
		}

		storage.stream('test', null, {size: 2})
		
	});

});
