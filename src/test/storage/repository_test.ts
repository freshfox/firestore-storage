import 'reflect-metadata';
import {BaseModel, BaseRepository} from "../../lib";
import {getFirestoreTestPath, TestFactory, UserRepository} from "../index";
import {injectable} from "inversify";
import * as should from 'should';
import * as admin from "firebase-admin";
import Timestamp = admin.firestore.Timestamp;

interface Model extends BaseModel {
	details?: {
		field1?: {
			subField1?: string;
			subField2?: string;
		},
		field2?: string
	},
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

	const tc = TestFactory.createWithRepository(this, ModelRepository);
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

});
