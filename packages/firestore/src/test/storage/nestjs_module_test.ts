import {Injectable, Module} from "@nestjs/common";
import {BaseRepository, FirestoreStorage, FirestoreStorageNestModule} from "../../lib";
import {Test} from "@nestjs/testing";
import {IStorageDriver, MemoryStorage, StorageDriver} from "firestore-storage-core";
import 'should';

describe('FirestoreStorageNestModule', function () {

	@Injectable()
	class MyRepo extends BaseRepository<any> {
		getCollectionPath(documentIds: string): string {
			throw new Error();
		}
	}

	@Module({
		imports: [
			FirestoreStorageNestModule.withFirestore(null)
		],
		providers: [
			MyRepo
		]
	})
	class TestModule {
	}

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

});
