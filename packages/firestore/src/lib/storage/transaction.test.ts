import { Account, AccountRepository, AccountsPath, ModelRepository, UserRepository } from './definitions.test';
import { createFirestoreTests } from './test-utils';
import { runFirestoreTransaction } from './transaction';
import { Firestore } from '@google-cloud/firestore';
import { CollectionIds } from 'firestore-storage-core';

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

	it('should query multiple documents', async () => {
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
});
