import {FirestoreStorageModule, Migrations} from '../../lib';
import {Container, injectable} from 'inversify';
import {User, UserRepository} from '../index';
import * as should from 'should';

describe('Migrations', function () {

	@injectable()
	class MyProjectMigrations extends Migrations {

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
			const users: User[] = await this.storage.query('users', qb => qb);
			for (const user of users) {
				user.name = `${user.firstname} ${user.lastname}`;
				await this.storage.save('users', user);
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

    it('should run a simple migration', async () => {

    	const u1 = await userRepo.save({
			firstname: 'John',
			lastname: 'Doe',
			email: 'john@example.com'
		});

		await migrations.upgrade();

		const u2 = await userRepo.getById(u1.id);
		should(u2.name).eql('John Doe');

		const version = migrations.readVersion();
		should(version).eql(2);
		
    });



});
