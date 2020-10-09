import * as firestore from '@google-cloud/firestore';
import * as path from 'path';

export async function exportFirestore(projectId: string, bucketName: string, dir: string, collectionIds?: string[]) {
	const client = new firestore.v1.FirestoreAdminClient();
	const databaseName =
		client.databasePath(projectId, '(default)');

	return client.exportDocuments({
		name: databaseName,
		outputUriPrefix: `gs://${path.join(bucketName, dir)}`,
		// Leave collectionIds empty to export all collections
		// or set to a list of collection IDs to export,
		// collectionIds: ['users', 'posts']
		collectionIds: collectionIds || []
	})
		.then(responses => {
			const response = responses[0];
			console.log(`Operation Name: ${response['name']}`);
		})
		.catch(err => {
			console.error(err);
			throw new Error('Export operation failed');
		});
}
