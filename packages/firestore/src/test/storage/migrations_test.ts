import {Container, inject, injectable} from 'inversify';
import * as should from 'should';
import {IStorageDriver, Migrations, StorageDriver} from "firestore-storage-core";
import {getFirestoreTestRunId, User, UserRepository} from "../index";
import {FirestoreStorageModule} from "../../lib";

describe('Migrations', function () {

	@injectable()
	class MyProjectMigrations extends Migrations {

		constructor(private userRepo: UserRepository,
					@inject(StorageDriver) protected storage: IStorageDriver) {
			super(storage);
		}

		getVersion(): number {
			return 2;
		}

		onUpgrade(toVersion: number) {
			switch (toVersion) {
				case 1:
					return this.combineName();
				case 2:
					return this.somethingElse();
			}
		}

		private async combineName() {
			const collectionPath = this.userRepo.getPath(getFirestoreTestRunId());
			const users: User[] = await this.storage.query(collectionPath, qb => qb);
			for (const user of users) {
				user.name = `${user.firstname} ${user.lastname}`;
				await this.storage.save(collectionPath, user);
			}
		}

		private async somethingElse() {

		}

	}

	const container = new Container();
	container.load(FirestoreStorageModule.createWithMemoryStorage());
	container.bind(UserRepository).toSelf().inSingletonScope();
	container.bind(MyProjectMigrations).toSelf().inSingletonScope();

	const userRepo = container.resolve(UserRepository);
	const migrations = container.resolve(MyProjectMigrations);

	beforeEach(async () => {
		return userRepo.clear();
	});

    it('should run a simple migration', async () => {

    	const u1 = await userRepo.save({
			firstname: 'John',
			lastname: 'Doe',
			email: 'john@example.com'
		});

		await migrations.upgrade();

		const u2 = await userRepo.getById(u1.id);
		should(u2.name).eql('John Doe');

		const version = await migrations.readVersion();
		should(version).eql(2);

    });



});
