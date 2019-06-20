# Firestore Storage
[![Build Status](https://travis-ci.org/freshfox/firestore-storage.svg?branch=master)](https://travis-ci.org/freshfox/firestore-storage)
[![npm version](https://badge.fury.io/js/firestore-storage.svg)](https://badge.fury.io/js/firestore-storage)
[![Dependencies](https://david-dm.org/inversify/inversify-express-utils.svg)](https://david-dm.org/freshfox/firestore-storage#info=dependencies)
[![img](https://david-dm.org/freshfox/firestore-storage/dev-status.svg)](https://david-dm.org/freshfox/firestore-storage/#info=devDependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/freshfox/firestore-storage/badge.svg)](https://snyk.io/test/github/freshfox/firestore-storage)

## Table of Contents

* [Overview](#overview)
* [Example](#example)
* [Installation](#installation)
* [Tests](#tests)
* [Usage](#usage)
* [Models](#models)
* [Repository](#repositories)
* [Transactions](#transactions)
* [Migrations](#migrations)
* [Throwing custom errors](#custom-error)

## Overview
>Typed repositories for Node around Firestore providing a very simple API to
write and read documents. Including a simple to use query builder and an in-memory
storage implementation for running blazing fast tests

Firestore Storage provides a thin layer of abstraction to accessing data in Firestore.
It follows the repository pattern, for more information about it you can read this
[short article][repo-article]

## Example

```typescript
const userRepo = new UserRepository();

// Saving a user
const user = await userRepo.save({
  name: 'John Doe',
  active: true
});

console.log(user);
/* prints
{
  id: '0vdxYqEisf5vwJLhyLjA',
  name: 'John Doe',
  active: true,
  createdAt: '2019-04-29T16:35:33.195Z',
  updatedAt: '2019-04-29T16:35:33.195Z'
}*/

// Listing all documents
const allUsers = await userRepo.list();

// Filtering documents based on attributes
const activeUsers = await userRepo.list({
  active: true
});

// More complex queries
const date = new Date('2019-02-01');
const asd = await userRepo.query((qb) => {
  return qb
    .where('signUpDate', '<=', date)
    .orderBy('signUpDate', 'asc');
});
```

## Installation

The `firestore-storage` package is available via npm

```bash
$ npm install firestore-storage
# or
$ yarn add firestore-storage
```

## Tests
To run all tests using only the `MemoryStorage` implementation run:
```bash
$ yarn test
```

It's also possible to run all tests using the `FirestoreStorage` implementation. To do this
you need to create a Firebase project and download the Admin SDK credentials file.
Copy the `.env.sample` to `.env` and add the absolute path to the `FIREBASE_CREDENTIALS` variable.
To execute the tests run:
```bash
$ yarn test:firestore
```

To run tests using both `MemoryStorage` and `FirestoreStorage` run
```bash
$ yarn test:all
```

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
	
  listAllActive() {
    return this.list({active: true});
  }
}

const repo = new UserRepository();
```

### Inversify
This library fully supports [Inversify][inversify] To use it you have load the `FirestoreStorageModule` module 
into your container and add the `@injectable()` decorator to each repository class. This will automatically
inject the correct storage implementation (Firestore or In-Memory) into your repositories

```typescript
if (process.env.NODE_ENV === 'test') {
  container.load(FirestoreStorageModule.createWithMemoryStorage());
} else {
  container.load(FirestoreStorageModule.createWithFirestore(admin.firestore()));
}

container.bind(UserRepository).toSelf().inSingletonScope();
```

## Models

Your models should extend or implement the interface `BaseModel` which contains the id and
modification timestamps.
```typescript
interface BaseModel {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

Since those values are not in the document itself, they will be added to the
returning object when reading from Firestore. You can pass objects with those attributes to
the `save()` function. They will always be omitted and the id will be used as the document id
when writing data.

## Repositories

Create repository classes for each collection you want to query documents from. For example
if you want to query documents to query from the `users` collection you create a class `UserRepository` extending `BaseRepository`.
Each repository provides a list of functions for saving, querying and deleting documents
and you can extend each repository based on your needs.

When extending `BaseRepository` you have to implement the function
`getCollectionPath(...ids: string[])`. For root collections the ids[] will be empty.
For sub-collections this parameter will contain an hierarchically ordered list of parent
document ids.

Each function takes multiple ids as its last arguments. Those are the hierarchically
ordered list of parent document ids passed to the `getCollectionPath(...)` function.

The following examples are based on the `UserRepository` and `TodoRepository`
created [below](#Extending BaseRepository)

## Transactions

Each repository as well as the FirestoreStorage and MemoryStorage implementations
provide a [transaction()](#transaction) function.

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

#### QueryBuilder functions

```
qb.where(fieldName, operator, value)
qb.orderBy(fieldName, direction) // 'asc' or 'desc'
qb.offset(number)
qb.limit(number)
```

### batchGet
Returns an array of documents for a given array of ids. The array will contain null values if some documents aren't found
```typescript
const users = await userRepo.batchGet([userId1, userId2]);
```

### save
Saves a document into Firestore.
```typescript
const user = await userRepo.save({
  name: 'John',
  email: 'john@exmaple.com'
});
```
If you want to update data you just have to pass the id of the document.
```typescript
const user = await userRepo.save({
  id: '8zCW4UszD0wmdrpBNswp',
  name: 'John',
  email: 'john@exmaple.com'
});
```
By default this will create the document with this id if it doesn't exist
or merge the properties into the existing document. If you want to write a document
and instead of don't merge use the [write()][write] function

### write 
Sets the passed data. If the document exists it will be overwritten.
```typescript
const user = await userRepo.write({
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

### transaction
Takes an update function and an array of ids. Find more about transactions at the
[Firestore documentation][transaction-doc]
```typescript
const result = await userRepo.transaction((trx) => {
	const u = trx.get('some-id');
	u.name = 'John';
	trx.set(u);
	return 'worked';
})
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

## Migrations

This package provides a base class to migrate data in Firestore.
For more info look at [this example](src/test/storage/migrations_test.ts)

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
[repo-article]: [https://medium.com/@pererikbergman/repository-design-pattern-e28c0f3e4a30]
[transaction-doc]: https://firebase.google.com/docs/firestore/manage-data/transactions
