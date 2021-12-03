import {IndexManager, QueryScope} from "../lib";

interface User {
	name: string;
	registeredAt: Date;
	address: {
		street: string;
		zip: number
	}
}

export const indexManager = new IndexManager()
	.addIndex<User>('users', QueryScope.Collection)
	/**/.field('name')
	/**/.field('address.street')
	/**/.add()
	.addIndex<User>('users', QueryScope.Collection)
	/**/.field('address.city')
	/**/.field('address.zip')
	/**/.add()
