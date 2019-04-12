# Firestore Storage

_A typed wrapper for Node around Firestore including a querybuilder and an in-memory implementation for running tests_

## Usage

**Firestore Storage** can be used with the dependency injection library [Inversify][inversify]
as well as without it.

```typescript
// In another file (storage.ts)
export const storage = new FirestoreStorage(admin.firestore());
// OR
export const storage = new MemoryStorage();

// user_repository.ts
import {storage} from './storage';

class UserRepository extends BaseRepository<User> {

	constructor() {
		super(storage);
	}

	getCollectionPath(...documentIds: string[]): string {
		return 'users';
	}
}

const repo = new UserRepository();
```

### Inversify
If you want to use this package with inversify you have load the `FirestoreStorageModule` module 
into your container and set the `@injectable()` decorator to each repository class.

```typescript
container.load(FirestoreStorageModule.createWithMemoryStorage());
// or
container.load(FirestoreStorageModule.createWithFirestore(admin.firestore()));
```

## Repositories

Create repository classes for each collection you want to query documents from. For example
if you want to query documents to query from the `users` collection you create a class `UserRepository` extending `BaseRepository`.
Each repository provides a list of functions for saving, querying and deleting documents.

### findById
Takes a hierarchical ordered list of document ids. Returns the document when found or `null`
```typescript
const todo = await todoRepo.findById(userId, todoId);
```

### find
Queries the collection to match the given arguments, returns the first result or `null` if none is found.
```typescript
const doneTodo = await todoRepo.find({
  done: true
}, userId);
```

### getById
Works exactly like [findById](#findbyid) but throws an error if no document was found

### get
Works exactly like [find](#find) but throws an error if no document was found

### list
Query a list of documents with a set of given arguments. This function always returns an array. If no results were found
the array will be empty

```typescript
const allDoneTodos = await todoRepo.list({
  done: true
}, userId);
```

### query
Do more complex queries like `greater than` and `lower than` comparisons.
```typescript
const passedDeadlineTodos = await todoRepo.query(() => {
  return qb
    .where('done', '==', false)
    .where('deadlineDate', '<', new Date());
});
```
Valid operators are `==` | `<` | `<=` | `>` | `>=`

### batchGet
Returns an array of documents for a given array of ids. The array will contain null values if some documents aren't found
```typescript
const users = await userRepo.batchGet([userId1, userId2]);
```

### save
Saves a document into Firestore
```typescript
const user = await userRepo.save({
  name: 'John',
  email: 'john@exmaple.com'
});
```

### delete
Deletes a document by a given id
```typescript
// For a nested collection
await todoRepo.delete(userId, todoId);
// For a root level collection
await userRepo.delete(userId);
```

### Extending BaseRepository

```typescript
export class UserRepository extends BaseRepository<User> {

	getCollectionPath(...documentIds: string[]): string {
		return 'users';
	}
}
```

When creating repositories for nested collection it's always a good idea to check if the correct ids are passed into
`getCollectionPath(...)`.

```typescript
export class TodoRepository<T> extends BaseRepository<Todo> {

	getCollectionPath(...documentIds): string {
		const id = documentIds.shift();
		if (!id) {
			throw new Error('User id is missing');
		}
		return `users/${id}/todos`;
	}
}
```

This will throw an error when trying to save or query without passing the user id.
```typescript
await todoRepo.save({...}); // Throws and error
await todoRepo.save({...}, '<userId>'); // Succeeds
```

## Custom error
The query functions [get](#get) and [getById](#getbyid) will throw an error if the document doesn't exist.
If you want to throw an custom error you can do that by passing an error factory.
```typescript
export class HttpError extends Error {
	constructor(msg: string, public code: number) {
		super(msg)
	}
}

const errorFactory = (msg) => {
  return new HttpError(msg, 404);
};

```

### Using Inversify
```typescript
FirestoreStorageModule.createWithFirestore(admin.firestore(), errorFactory)
```

### Using vanilla Typescript
```typescript
class UserRepository extends BaseRepository<User> {

  constructor() {
    super(storage, errorFactory);
  }
}
```


[inversify]: http://inversify.io/
