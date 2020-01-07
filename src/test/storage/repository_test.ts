import 'reflect-metadata';
import {BaseModel, BaseRepository} from "../../lib";
import {getFirestoreTestPath, TestFactory, UserRepository} from "../index";
import {injectable} from "inversify";
import * as should from 'should';

interface Model extends BaseModel {
	details: {
		field1?: {
			subField1?: string;
			subField2?: string;
		},
		field2?: string
	}
}

@injectable()
class ModelRepository extends BaseRepository<Model> {
	getCollectionPath(...documentIds: string[]): string {
		return getFirestoreTestPath('genericModels');
	}
}

describe('Repository', function () {

	const tc = TestFactory.createWithRepository(this, ModelRepository, null, false);
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

});
