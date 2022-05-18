import {Injectable, Module} from "@nestjs/common";
import {BaseRepository, FirestoreStorage, FirestoreStorageNestModule} from "../../lib";
import {Test} from "@nestjs/testing";
import {CollectionUtils, IStorageDriver, MemoryStorage, Repository, StorageDriver} from "firestore-storage-core";
import 'should';

describe('FirestoreStorageNestModule', function () {

	@Injectable()
	@Repository({
		path: CollectionUtils.createPath('/test/{id}')
	})
	class MyRepo extends BaseRepository<any> {
	}

	@Module({
		imports: [
			FirestoreStorageNestModule.withFirestore(null)
		],
		providers: [
			MyRepo
		]
	})
	class TestModule {}

	it('should inject FirestoreStorage', async () => {

		const moduleRef = await Test.createTestingModule({
			imports: [TestModule]
		}).compile();
		const service = moduleRef.createNestMicroservice({});
		const storage = service.get<IStorageDriver>(StorageDriver);
		storage.should.instanceOf(FirestoreStorage);

	});

	it('should inject MemoryStorage', async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [TestModule],
			exports: [TestModule]
		})
			.overrideProvider(StorageDriver).useFactory({
				factory: (memStorage) => memStorage,
				inject: [MemoryStorage]
			})
			.compile();
		const service = moduleRef.createNestMicroservice({});
		const storage = service.get<IStorageDriver>(StorageDriver);
		storage.should.instanceOf(MemoryStorage);
	});

	it('should configure module using async providers', async () => {

		const moduleRef = await Test.createTestingModule({
			imports: [
				FirestoreStorageNestModule.forRootAsync({
					useFactory: () => {
						return null
					}
				})
			],
			providers: [
				MyRepo
			]
		}).compile();

		const repo = moduleRef.get(MyRepo);
		repo.should.instanceOf(MyRepo);

	});

});
