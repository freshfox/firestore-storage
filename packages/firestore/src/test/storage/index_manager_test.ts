import {IndexManager, QueryScope} from "../../lib/storage/index_manger";

describe('IndexManager', function () {

	interface User {
		name: string;
		registeredAt: Date;
		address: {
			street: string;
			zip: number
		}
	}

	it('should create an index', async () => {
		const indexJson = new IndexManager()
			.addIndex<User>('users', QueryScope.Collection)
			/**/.field('name')
			/**/.field('address.street')
			/**/.add()
			.addIndex<User>('users', QueryScope.Collection)
			/**/.field('address.city')
			/**/.field('address.zip')
			/**/.add()
			.toJSON();
		indexJson.should.eql('{"indexes":[{"collectionGroup":"users","queryScope":"COLLECTION","fields":[{"fieldPath":"name","order":"ASCENDING"},{"fieldPath":"address.street","order":"ASCENDING"}]},{"collectionGroup":"users","queryScope":"COLLECTION","fields":[{"fieldPath":"address.city","order":"ASCENDING"},{"fieldPath":"address.zip","order":"ASCENDING"}]}]}');
	});
});
