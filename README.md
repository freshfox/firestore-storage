# Firestore Storage

A typed wrapper around Firestore incluing a querybuilder and an in-memory implementation for testing

## Usage

**Firestore Storage** can be used with the dependency injection library [Inversify][inversify]
as well as without it.

```typescript
const storage = new MemoryStorage();

class UserRepository extends BaseRepository<User> {

	constructor() {
		super();
		this.storage = storage;
	}

	getCollectionPath(...documentIds: string[]): string {
		return 'users';
	}
}

const repo = new UserRepository();
```

## Repositories



### Extending BaseRepository

```typescript
export class UserRepository extends BaseRepository<User> {

	getCollectionPath(...documentIds: string[]): string {
		return 'users';
	}
}
```

[inversify]: http://inversify.io/
