import {getFirestoreTestPath, TestCase} from "../index";
import * as should from 'should'
import {FirestoreStorage, MemoryStorage} from "../../lib";

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

			const r1 = await storage.save(restaurantPath, {name: 'Ebi'});
			const r2 = await storage.save(restaurantPath, {name: 'Hiro'});
			const r3 = await storage.save(restaurantPath, {name: 'McDonalds'});

			const rev = await storage.save(`${restaurantPath}/${r1.id}/reviews`, {
				rating: 5,
				date: new Date()
			});

			const exportData = await (storage as FirestoreStorage).export(getFirestoreTestPath());

			const mem = new MemoryStorage();
			mem.setData(exportData);

			const rev2 = await mem.findById(`${restaurantPath}/${r1.id}/reviews`, rev.id);
			should(rev2.date).instanceOf(Date);

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
