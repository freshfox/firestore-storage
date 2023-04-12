import 'should';
import { Firestore } from '@google-cloud/firestore';
import { Migrations } from './migrations';
import { AccountRepository } from './definitions.test';
import { createFirestoreTests } from './test-utils';

describe('Migrations', function () {
	class MyProjectMigrations extends Migrations {
		public readonly accountRepo: AccountRepository;

		constructor(firestore: Firestore) {
			super(firestore);
			this.accountRepo = new AccountRepository(firestore);
		}

		getVersion(): number {
			return 1;
		}

		onUpgrade(toVersion: number) {
			switch (toVersion) {
				case 1:
					return this.appendToName();
			}
		}

		private async appendToName() {
			const accounts = await this.accountRepo.list(null);
			for (const account of accounts) {
				await this.accountRepo.update({
					id: account.id,
					name: `${account.name}-1`,
				});
			}
		}
	}

	let migrations: MyProjectMigrations;
	createFirestoreTests(this, (firestore) => {
		migrations = new MyProjectMigrations(firestore);
	});

	it('should run a simple migration', async () => {
		await migrations.readVersion().should.resolvedWith(0);
		let a1 = await migrations.accountRepo.save({
			name: 'acc1',
		});
		let a2 = await migrations.accountRepo.save({
			name: 'acc2',
		});
		await migrations.upgrade();

		a1 = await migrations.accountRepo.getById({ accountId: a1.id });
		a2 = await migrations.accountRepo.getById({ accountId: a2.id });

		a1.name.should.eql('acc1-1');
		a2.name.should.eql('acc2-1');
		await migrations.readVersion().should.resolvedWith(1);
	});
});
