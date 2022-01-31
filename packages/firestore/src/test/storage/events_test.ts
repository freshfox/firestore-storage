import {TestCase} from "../index";
import {FirestoreStorage, StorageEventType} from "../../lib";
import 'should';
import {BaseModel} from "firestore-storage-core";
import {v4 as uuid} from 'uuid';
import {StorageEventAccumulator} from "../../lib/storage/accumulator";

describe('Events', function () {

	const tc = new TestCase(true);
	const storage = tc.getStorage() as FirestoreStorage;

	type Post = BaseModel & { authorId?: string };

	if (storage instanceof FirestoreStorage) {

		it('should track write and delete events', async () => {

			const accumulator = new StorageEventAccumulator(storage);

			const p1 = await storage.save<Post>('posts', {});
			const p2 = await storage.save<Post>('posts', {});
			await storage.delete('posts', p1.id);

			accumulator.get().should.eql({
				[StorageEventType.Write]: {
					'posts': 2
				},
				[StorageEventType.Read]: {
					'posts': 2
				},
				[StorageEventType.Delete]: {
					'posts': 1
				}
			});
			accumulator.off();
		});

		it('should track read event by findById()', async () => {

			const accumulator = new StorageEventAccumulator(storage);

			const p1 = await storage.save<Post>('posts', {});
			await storage.findById('posts', p1.id);

			accumulator.get().should.eql({
				[StorageEventType.Write]: {
					'posts': 1
				},
				[StorageEventType.Read]: {
					'posts': 2
				}
			});
			accumulator.off();

		});

		it('should track read events by find()', async () => {

			const accumulator = new StorageEventAccumulator(storage);

			const p1 = await storage.save<Post>('posts', {authorId: 'a1'});
			const p2 = await storage.save<Post>('posts', {authorId: 'a1'});
			await storage.find('posts', (qb) => {
				return qb.where('authorId', '==', 'a1');
			});

			accumulator.get().should.eql({
				[StorageEventType.Write]: {
					'posts': 2
				},
				[StorageEventType.Read]: {
					'posts': 3
				}
			});
			accumulator.off();
		});

		it('should track read events by query()', async () => {

			const accumulator = new StorageEventAccumulator(storage);

			const authorId = uuid();

			const p1 = await storage.save<Post>('posts', {authorId: authorId});
			const p2 = await storage.save<Post>('posts', {authorId: authorId});
			const p3 = await storage.save<Post>('posts', {authorId: 'a2'});
			await storage.query('posts', (qb) => {
				return qb.where('authorId', '==', authorId);
			});

			accumulator.get().should.eql({
				[StorageEventType.Write]: {
					'posts': 3
				},
				[StorageEventType.Read]: {
					'posts': 5
				}
			});
			accumulator.off();
		});
	}

});
