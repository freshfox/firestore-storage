# Firestore Storage
[![Build Status](https://travis-ci.com/freshfox/firestore-storage.svg?branch=master)](https://travis-ci.com/freshfox/firestore-storage)
[![npm version](https://badge.fury.io/js/firestore-storage.svg)](https://badge.fury.io/js/firestore-storage)
[![Dependencies](https://david-dm.org/freshfox/firestore-storage.svg)](https://david-dm.org/freshfox/firestore-storage#info=dependencies)
[![img](https://david-dm.org/freshfox/firestore-storage/dev-status.svg)](https://david-dm.org/freshfox/firestore-storage/#info=devDependencies)
[![Known Vulnerabilities](https://snyk.io/test/github/freshfox/firestore-storage/badge.svg)](https://snyk.io/test/github/freshfox/firestore-storage)

## Table of contents

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

## Overview
> Typed repositories for Node around Firestore providing a very simple API to
> write and query documents.

## Example
```typescript
// Path is /users/{userId}
const user = await userRepo.save({
   email: 'john@example.com'
});

const user = await userRepo.findById({
  userId: 'some-user-id'
});

// Path is /restaurants/{restaurantId}/ratings/{ratingId}
const fiveStars = await ratingRepo.list({
	stars: 5
}, { restaurantId: 'some-restaurant-id' });
```

## Usage

### Installation
```bash
npm install firestore-storage-core
npm install firestore-storage
```

### Defining collection paths
Collection paths are defined using the `CollectionPath` class instead of
just a string, to provide detailed information for this path. Such as the
name of the collection and the name of the id. Defining a root collection
path such as `/restaurants/{restaurantId}` will look like:
```typescript
const RestaurantsCollection = new CollectionPath('restaurants', 'restaurantId');
```
When defining subcollections, the parent collection gets passed as
the third parameter. Currently, generic types have to be passed as well
to have the correct typings in your repositories.
A subcollection such as `/restaurants/{restaurantId}/ratings/{ratingId}` looks like:
```typescript
const RatingsCollection = new CollectionPath<'ratingId', string, DocumentIds<typeof RestaurantsCollection>>('ratings', 'ratingId', RestaurantsCollection);
```

### Creating repositories

```typescript
import { BaseRepository } from 'firestore-storage';
import { BaseModel, Repository} from 'firestore-storage-core';

interface Rating extends BaseModel {
	stars: number
}

@Repository({
	path: RatingsCollection
})
export class RatingsRepository extends BaseRepository<Rating, RatingsCollection> {

}
```

### Return value conventions for methods

- `find*()` methods return the document or null when no result was found
- `get*()` methods always return the document and will throw an error when no result was found
- `list*()` methods always return an array and never null or undefined. When no result is found the array is empty

## Defining collection paths


## Example

```typescript
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
