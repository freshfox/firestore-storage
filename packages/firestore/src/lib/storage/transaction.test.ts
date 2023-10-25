import { Account, AccountRepository, AccountsPath, ModelRepository, UserRepository } from './definitions.test';
import { createFirestoreTests } from './test-utils';
import { runFirestoreTransaction } from './transaction';
import { Firestore } from '@google-cloud/firestore';
import 'should';

describe('Transaction', function () {
	let firestore: Firestore;
	let modelRepo: ModelRepository;
	let accountRepo: AccountRepository;
	let userRepo: UserRepository;

	createFirestoreTests(this, (f) => {
		firestore = f;
		modelRepo = new ModelRepository(firestore);
		userRepo = new UserRepository(firestore);
		accountRepo = new AccountRepository(firestore);
	});

	it('should create a document', async () => {
		const acc = await accountRepo.create({
			name: 'Test',
		});

		await runFirestoreTransaction(firestore, async (trx) => {
			const a = await trx.getById(accountRepo, { accountId: acc.id });
			trx.create(
				accountRepo,
				{
					name: a.name + '2',
				},
				undefined
			);
		});
	});

	it('should query documents', async () => {
		const create = async (name: string) => {
			const acc = await accountRepo.create({
				name,
			});
			return acc.id;
		};

		const prefix = `acc-${Date.now()}`;

		const [a1, a2, a3, a4] = await Promise.all([
			create(prefix + 'Test1'),
			create(prefix + 'Test2'),
			create(prefix + 'Test3'),
			create(prefix + 'Test1'),
		]);

		const ids = await runFirestoreTransaction(firestore, async (trx) => {
			const accounts = await trx.query(
				accountRepo,
				(qb) => {
					return qb.whereAll({
						name: prefix + 'Test1',
					});
				},
				undefined
			);
			return accounts.map((a) => a.id);
		});
		ids.sort().should.eql([a1, a4].sort());
	});
});
