# Firestore Storage
[![Build Status](https://travis-ci.com/freshfox/firestore-storage.svg?branch=master)](https://travis-ci.com/freshfox/firestore-storage)
[![npm version](https://badge.fury.io/js/firestore-storage.svg)](https://badge.fury.io/js/firestore-storage)
[![Dependencies](https://david-dm.org/freshfox/firestore-storage.svg)](https://david-dm.org/freshfox/firestore-storage#info=dependencies)
[![img](https://david-dm.org/freshfox/firestore-storage/dev-status.svg)](https://david-dm.org/freshfox/firestore-storage/#info=devDependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/freshfox/firestore-storage/badge.svg)](https://snyk.io/test/github/freshfox/firestore-storage)

## Table of Contents

* [Overview](#overview)
* [Example](#example)
* [Installation](#installation)
* [Tests](#tests)
* [Usage](#usage)
* [Models](#models)
* [Transactions](#transactions)
* [Repository](#repositories)
* [Migrations](#migrations)
* [Typing indexes](#typing-indexes)
* [Throwing custom errors](#custom-error)

## Overview
>Typed repositories for Node around Firestore providing a very simple API to
write and read documents. Including a simple to use query builder and an in-memory
storage implementation for running blazing fast tests

Firestore Storage provides a thin layer of abstraction to accessing data in Firestore.
It follows the repository pattern, for more information about it you can read this
[short article](https://medium.com/@pererikbergman/repository-design-pattern-e28c0f3e4a30)

### Return value conventions for methods

- `find*()` methods return the document or null when no result was found
- `get*()` methods always return the document and will [throw an error](#custom-error) when no result was found
- `list*()` methods always return an array and never null. When no result is found the array is empty

## Example

```typescript
const restaurantRepo = new RestaurantRepository();

// Saving data
const restaurant = await restaurantRepo.save({
  name: 'FreshFoods',
  address: 'SomeStreet 123',
  city: 'New York',
  type: 'vegan'
});

console.log(restaurant);
/*
{
  id: '0vdxYqEisf5vwJLhyLjA',
  name: 'FreshFoods',
  address: 'SomeStreet 123',
  city: 'New York',
  type: 'vegan',
  createdAt: Date('2019-04-29T16:35:33.195Z'),
  updatedAt: Date('2019-04-29T16:35:33.195Z')
}*/

// Listing all documents
const allRestaurants = await restaurantRepo.list();

// Filtering documents based on attributes
const restaurantsInNewYork = await restaurantRepo.list({
  city: 'New York'
});

// More complex queries
const date = new Date('2019-02-01');
const restaurants = await restaurantRepo.query((qb) => {
  return qb
    .where('openDate', '<=', date)
    .orderBy('openDate', 'asc');
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
$ yarn test
```

### Running tests on your firestore.rules

This packages provides utilities to run tests against your Firestore rules.
You need the `@firebase/testing` package and the local emulator installed.
To install the emulator run `$ firebase setup:emulators:firestore`

Below is an example of how to run tests against the rules. Create a new instance
of FirestoreRuleTest for each test. Add some test data, load the rules and run your assertions.
The constructor of `FirestoreRuleTest` takes the uid of the authenticated user as an argument.
This will be the `request.auth.uid` property which you can read in your rules.
Passing no uid will send unauthenticated requests to the emulator.

```typescript
import {FirestoreRuleTest} from 'firestore-storage';
import * as firebase from "@firebase/testing";

describe('Rules', function () {

	const pathToRules = `${__dirname}/../../../../firestore.rules`;

	before(async () => {
		await FirestoreRuleTest.start();
	});

	after(async () => {
		await FirestoreRuleTest.stop();
	});

	describe('Unauthenticated', function () {

		it('should not be able to read from users', async () => {
			const tc = new FirestoreRuleTest();
			const userId = 'alice';
			const userDoc = tc.firestore.collection('users').doc(userId);
			await userDoc.set({});
			await tc.loadRules(pathToRules);
			await firebase.assertFails(userDoc.get())
		});
	});

	describe('Authenticated', function () {

		it('should not be able to read reservations from different account', async () => {

			const userId1 = 'alice';
			const accountId1 = `account-${userId1}`;
			const userId2 = 'bob';
			const accountId2 = `account-${userId2}`;


			const tc = new FirestoreRuleTest(userId1);
			const userDoc1 = tc.firestore.collection('users').doc(userId1);
			const userDoc2 = tc.firestore.collection('users').doc(userId2);

			await userDoc1.set({accountId: accountId1});
			await userDoc2.set({accountId: accountId2});

			const resColl1 = tc.firestore.collection('accounts').doc(accountId1).collection('reservations');
			const resColl2 = tc.firestore.collection('accounts').doc(accountId2).collection('reservations');

			await resColl1.add({});
			await resColl2.add({});

			await tc.loadRules(pathToRules);

			await firebase.assertSucceeds(resColl1.get());
			await firebase.assertFails(resColl2.get());

		});

	});

});
```

## Usage

**Firestore Storage** can be used with the dependency injection library [Inversify][inversify]
as well as without it.

```typescript
// In another file (storage.ts)
export const storage = new FirestoreStorage(admin.firestore());
// OR
export const storage = new MemoryStorage();

// restaurant_repository.ts
import {storage} from './storage';

class RestaurantRepository extends BaseRepository<Restaurant> {

  constructor() {
    super(storage);
  }

  getCollectionPath(...documentIds: string[]): string {
    return 'restaurants';
  }

  listVegan() {
    return this.list({type: 'vegan'});
  }
}

const repo = new RestaurantRepository();
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

container.bind(RestaurantRepository).toSelf().inSingletonScope();
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

## Transactions

Each repository as well as the FirestoreStorage and MemoryStorage implementations
provide a [transaction()](#transaction) function.

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

The following examples are based on the `RestaurantRepository` and `ReviewRepository`
created [below](#extending-baserepository)

### findById
Takes a hierarchical ordered list of document ids. Returns the document when found or `null`
```typescript
const review = await reviewRepo.findById(restaurantId, reviewId);
```

### find
Queries the collection to match the given arguments, returns the first result or `null` if none is found.
```typescript
const review = await reviewRepo.find({
  rating: 5
}, restaurantId);
```

### getById
Works exactly like [findById](#findbyid) but [throws an error](#custom-error) if no document was found

### get
Works exactly like [find](#find) but [throws an error](#custom-error) if no document was found

### list
Query a list of documents with a set of given arguments. This function always returns an array. If no results were found
the array will be empty

```typescript
const allOneStarRatings = await reviewRepo.list({
  rating: 1
}, restaurantId);
```

### query
Do more complex queries like `greater than` and `lower than` comparisons.
```typescript
const reviews = await reviewRepo.query(() => {
  return qb
    .where('rating', '==', 2)
    .where('submitDate', '<', new Date('2019-12-31'));
}, restaurantId);
```
Valid operators are `==` | `<` | `<=` | `>` | `>=`

#### QueryBuilder functions

```
qb.where(fieldName, operator, value)
qb.orderBy(fieldName, direction) // 'asc' or 'desc'
qb.offset(number)
qb.limit(number)
```

### findAll
Returns an array of documents for a given array of ids. The array will contain null values if some documents aren't found
```typescript
const r = await restaurantRepo.findAll([id1, id2]);
```

### getAll
Returns an array of documents for a given array of ids. The array won't contain null values. If a document doesn't exists,
an error will be thrown
```typescript
const r = await restaurantRepo.getAll([id1, id2]);
```

### save
Saves a document into Firestore.
```typescript
const restaurant = await restaurantRepo.save({
  name: 'Ebi'
});
```
If you want to update data you just have to pass the id of the document.
```typescript
const user = await restaurantRepo.save({
  id: '8zCW4UszD0wmdrpBNswp',
  name: 'Ebi',
  openDate: new Date()
});
```
By default this will create the document with this id if it doesn't exist
or merge the properties into the existing document. If you want to write a document
and instead of don't merge use the [write()][write] function

### write
Sets the passed data. If the document exists it will be overwritten.
```typescript
const user = await restaurantRepo.write({
  name: 'FreshBurgers',
  openDate: new Date()
});
```

### delete
Deletes a document by a given id
```typescript
// For a nested collection
await reviewRepo.delete(restaurantId, reviewId);
// For a root level collection
await restaurantRepo.delete(restaurantId);
```

### transaction
Takes an update function and an array of ids. Find more about transactions at the
[Firestore documentation][transaction-doc]
```typescript
const result = await restaurantRepo.transaction((trx) => {
	const u = trx.get('some-id');
	u.name = 'Burger Store';
	trx.set(u);
	return 'done';
})
```

### Extending BaseRepository

```typescript
export class RestaurantRepository extends BaseRepository<Restaurant> {

	getCollectionPath(...documentIds: string[]): string {
		return 'restaurants';
	}
}
```

When creating repositories for nested collection it's always a good idea to check if the correct ids are passed into
`getCollectionPath(...)`.

```typescript
export class ReviewRepository<T> extends BaseRepository<Review> {

  getCollectionPath(...documentIds): string {
    const id = documentIds.shift();
    if (!id) {
      throw new Error('RestaurantId id is missing');
    }
    return `restaurants/${id}/reviews`;
  }
}
```

This will throw an error when trying to save or query without passing the user id.
```typescript
await reviewRepo.save({...}); // Throws and error
await reviewRepo.save({...}, '<restaurantId>'); // Succeeds
```

## Migrations

This package provides a base class to migrate data in Firestore.
For more info look at [this example](packages/firestore/src/test/storage/migrations_test.ts)

## Typing indexes
Use the `IndexManager` class to build your index structure and the provided `fss`
script to generate the `firestore.indexes.json`. Look at `src/test/storage/index_manager_example.ts`
to see how to use the `IndexManager`. Then run:
```bash
$ fss generate:index <input-path-to-js> <output-path-to-json>
```
The `fss` script gets added as a script to your `node_modules`

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
class RestaurantRepository extends BaseRepository<Restaurant> {

  constructor() {
    super(storage, errorFactory);
  }
}
```

[inversify]: http://inversify.io/
[transaction-doc]: https://firebase.google.com/docs/firestore/manage-data/transactions
