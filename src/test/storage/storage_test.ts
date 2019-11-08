import {TestCase} from "../index";
import * as should from 'should'

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

});

interface Post {
	id: string;
	content?: {
		html?: string,
		text?: string;
	},
	comments?: {id: string}[]

}
