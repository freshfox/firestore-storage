# Firestore Storage

_A typed wrapper for Node around Firestore including a querybuilder and an in-memory implementation for testing_

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

Create repositories for each collection you want to query documents. For example
if you want to query documents at the root of Firestore ```/users``` you create
a new class and extend the BaseRepository.

### Extending BaseRepository

```typescript
export class UserRepository extends BaseRepository<User> {

	getCollectionPath(...documentIds: string[]): string {
		return 'users';
	}
}
```

[inversify]: http://inversify.io/
