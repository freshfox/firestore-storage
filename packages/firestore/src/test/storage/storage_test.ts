import {getFirestoreTestCollection, getFirestoreTestPath, getFirestoreTestRunId, TestCase} from "../index";
import * as should from 'should'
import {FirestoreStorage} from "../../lib";
import * as admin from "firebase-admin";
import Timestamp = admin.firestore.Timestamp;
import {BaseModel, MemoryStorage} from "firestore-storage-core";

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

	it('should clear a collection', async () => {

		const restaurantPath = getFirestoreTestPath('restaurants');
		const r1 = await storage.save(restaurantPath, {name: 'R1'});
		const r2 = await storage.save(restaurantPath, {name: 'R2'});

		const userPath = getFirestoreTestPath('users');
		const u1 = await storage.save(userPath, {name: 'U1'});
		const u2 = await storage.save(userPath, {name: 'U2'});

		should(await storage.query(restaurantPath)).length(2);

		await storage.clear(restaurantPath);

		should(await storage.query(restaurantPath)).length(0);
		should(await storage.query(userPath)).length(2);

	});

	it('should query a subcollection', async () => {

		const reviewPath = getFirestoreTestPath('restaurants/r1/locations');
		const r1 = await storage.save(getFirestoreTestPath('restaurants/r1/locations'), {
			id: null,
			settings: {
				enabled: true
			}
		});
		const r2 = await storage.save(getFirestoreTestPath('restaurants/r1/locations'),  {
			id: null,
			settings: {
				enabled: false
			}
		});
		const r3 = await storage.save(getFirestoreTestPath('restaurants/r2/locations'),  {
			id: null,
			settings: {
				enabled: true
			}
		});

		const locations = await storage.groupQuery('locations', (qb) => {
			return qb.where('settings.enabled', '==', true);
		});

		if (storage instanceof MemoryStorage) {
			locations.should.length(2);
			locations[0].should.property('id', r1.id);
			locations[1].should.property('id', r3.id);
		}

		for (const location of locations) {
			location.should.property('settings').property('enabled', true);
		}

	});

	xit('should import selected collections', async () => {

		const ts = Date.now();

		function coll(name: string) {
			return `${ts}_${name}`;
		}

		const memoryStorage = new MemoryStorage();

		const restaurantPath = coll('restaurants');
		const r1 = await storage.save(restaurantPath, {name: 'R1'});
		const r2 = await storage.save(restaurantPath, {name: 'R2'});

		const userPath = coll('users');
		const u1 = await storage.save(userPath, {name: 'U1'});
		const u2 = await storage.save(userPath, {name: 'U2'});

		const accountPath = coll('accounts');
		const a1 = await storage.save(accountPath, {name: 'A1'});
		const a2 = await storage.save(accountPath, {name: 'A2'});

		const exportData = await storage.export(getFirestoreTestPath());

		await storage.clear(restaurantPath);
		await storage.clear(userPath);
		await storage.clear(accountPath);

		await storage.import(exportData/*,[restaurantPath, accountPath]*/);

		should(await storage.query(restaurantPath)).length(2);
		should(await storage.query(userPath)).length(0);
		should(await storage.query(accountPath)).length(2);

	});

	if (storage instanceof FirestoreStorage) {

		interface Restaurant extends BaseModel {
			name: string;
			dates: { date: Date }[];
		}

		it('should export data', async function () {

			this.timeout(100000);

			const restaurantPath = getFirestoreTestPath('restaurants');

			const r1 = await storage.save<Restaurant>(restaurantPath, {name: 'Ebi', dates: [{date: Timestamp.now()}]});
			const r2 = await storage.save<Restaurant>(restaurantPath, {name: 'Hiro'});
			const r3 = await storage.save(restaurantPath, {name: 'McDonalds'});

			const rev = await storage.save<Restaurant>(`${restaurantPath}/${r1.id}/reviews`, {
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

		it('should stream', async () => {
			const collection = getFirestoreTestPath('posts')
			for (let i = 0; i < 10; i++) {
				await storage.save(collection, {
					i: i
				});
			}

			let count = 0;
			const stream = storage.stream(collection);
			await new Promise((resolve, reject) => {
				stream
					.on('error', reject)
					.on('data', (doc) => {
						should(doc.id).type('string');
						should(doc.i).type('number');
						count++;
					})
					.on('end', resolve);
			});
			should(count).eql(10);
		});
	}

});

interface Post {
	id: string;
	content?: {
		html?: string,
		text?: string;
	},
	comments?: { id: string }[]

}
