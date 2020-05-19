import {getFirestoreTestCollection, getFirestoreTestPath, getFirestoreTestRunId, TestCase} from "../index";
import * as should from 'should'
import {FirestoreStorage, MemoryStorage} from "../../lib";
import * as admin from "firebase-admin";
import Timestamp = admin.firestore.Timestamp;

describe('Storage', function () {

	const tc = new TestCase();
	const storage = tc.getStorage();

	it('should save a document and override a sub-array', async () => {

		let data: Post = await storage.save('posts', <Post>{
			comments: [{id: '1'}]
		});
		data = await storage.save('posts', <Post>{
			id: data.id,
			comments: [{id: '2'}]
		});
		should(data.comments).length(1);
	});

	it('should save a document and override sub object properties', async () => {

		let data: Post = await storage.save('posts', <Post>{
			content: {
				html: 'html'
			}
		});
		data = await storage.save('posts', <Post>{
			id: data.id,
			content: {
				text: 'text'
			}
		}, {avoidMerge: true});
		should(data.content).eql({
			text: 'text',
		});
	});

	it('should save a document and merge sub object properties', async () => {
		let data: Post = await storage.save('posts', <Post>{
			content: {
				html: 'html'
			}
		});
		data = await storage.save('posts', <Post>{
			id: data.id,
			content: {
				text: 'text'
			}
		});
		should(data.content).properties({
			text: 'text',
			html: 'html'
		});
	});

	if (storage instanceof FirestoreStorage) {
		it('should export data', async function () {

			this.timeout(100000);

			const restaurantPath = getFirestoreTestPath('restaurants');

			const r1 = await storage.save(restaurantPath, {name: 'Ebi', dates: [{date: Timestamp.now()}]});
			const r2 = await storage.save(restaurantPath, {name: 'Hiro'});
			const r3 = await storage.save(restaurantPath, {name: 'McDonalds'});

			const rev = await storage.save(`${restaurantPath}/${r1.id}/reviews`, {
				rating: 5,
				date: Timestamp.now()
			});
			await storage.save(getFirestoreTestCollection(), {
				id: getFirestoreTestRunId(),
				testData: 123,
				someIds: [
					'test-1',
					'test-2',
					'test-3',
				]
			});

			const exportData = await (storage as FirestoreStorage).export(getFirestoreTestPath());

			const rest = await storage.query(restaurantPath);
			for (const res of rest) {
			}
			await storage.delete(getFirestoreTestCollection(), getFirestoreTestRunId());

			// Set data to memory storage
			const mem = new MemoryStorage();
			await mem.import(exportData);

			const rev2 = await mem.findById(`${restaurantPath}/${r1.id}/reviews`, rev.id);
			should(rev2.date).instanceOf(Timestamp);

			// Import data to firestore
			await storage.import(exportData);

			const testRun = await storage.findById(getFirestoreTestCollection(), getFirestoreTestRunId());
			should(testRun.someIds).eql([
				'test-1',
				'test-2',
				'test-3',
			]);

			const restaurant = await mem.findById(restaurantPath, r2.id);
			should(restaurant).property('id', r2.id);
		});
	}

});

interface Post {
	id: string;
	content?: {
		html?: string,
		text?: string;
	},
	comments?: {id: string}[]

}
