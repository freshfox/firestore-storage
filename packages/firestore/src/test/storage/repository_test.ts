import 'reflect-metadata';
import {BaseRepository} from "../../lib";
import {getFirestoreTestPath, TestFactory} from "../index";
import {injectable} from "inversify";
import * as should from 'should';
import * as admin from "firebase-admin";
import Timestamp = admin.firestore.Timestamp;
import {BaseModel} from "firestore-storage-core";

interface Model extends BaseModel {
	details?: {
		field1?: {
			subField1?: string;
			subField2?: string;
		},
		field2?: string
	},
	someIds?: string[],
	startTime?: Timestamp,
	endTime?: Timestamp
}

@injectable()
class ModelRepository extends BaseRepository<Model> {
	getCollectionPath(...documentIds: string[]): string {
		return getFirestoreTestPath('genericModels');
	}
}

describe('Repository', function () {

	const tc = TestFactory.createWithRepository(this, ModelRepository, null);
	const modelRepo = tc.resolve(ModelRepository);

	it('should query a nested object field', async () => {

		const m1 = await modelRepo.save({
			details: {
				field1: {
					subField1: 'subField1',
					subField2: 'subField2',
				}
			}
		});

		const m2 = await modelRepo.find({
			details: {
				field1: {
					subField1: 'subField1',
					subField2: 'subField2'
				},
			}
		});
		should(m2).property('id', m1.id);

		const m3 = await modelRepo.find({
			details: {
				field1: {
					subField1: 'subField1',
				},
			}
		});
		should(m3).null();

		const m4 = await modelRepo.find({
			details: {
				field1: {
					subField1: 'subField1',
					subField2: 'other'
				},
			}
		});
		should(m4).null()
	});

	it('should query with array-contains', async () => {
		const m1 = await modelRepo.save({someIds: ['a', 'b', 'c']});
		const m2 = await modelRepo.save({someIds: ['b', 'c']});
		const m3 = await modelRepo.save({someIds: ['a', 'b', 'd']});
		const m4 = await modelRepo.save({});

		const q1 = await modelRepo.query((qb) => {
			return qb.where('someIds', 'array-contains', 'a');
		});
		should(q1).length(2);
		should(q1[0].id).oneOf([m1.id, m3.id]);
		should(q1[1].id).oneOf([m1.id, m3.id]);

		const q2 = await modelRepo.query((qb) => {
			return qb.where('someIds', 'array-contains', 'e');
		});
		should(q2).length(0);
	});

	// Not supported by Firestore
	xit('should query between dates', async () => {

		function inDays(days: number) {
			const date = new Date();
			date.setDate(date.getDate() + days);
			return Timestamp.fromDate(date)
		}

		const m1 = await modelRepo.save({
			startTime: inDays(-1),
			endTime: inDays(1)
		});

		const m2 = await modelRepo.save({
			startTime: inDays(1),
			endTime: inDays(2)
		});

		const models = await modelRepo.query((qb) => {
			const now = new Date();
			return qb
				.where('startTime', '<=', now)
				.where('endTime', '>', now);
		});
		should(models).length(1);
		should(models[0]).property('id', m1.id);
	});

	xit('should create ReadStreams', async () => {

		const stream1 = modelRepo.stream(null, 'id1', 'id2');
		const stream2 = modelRepo.stream(null, {size: 10}, 'id1');
		const stream3 = modelRepo.stream(null, {size: 10});

	});

});
