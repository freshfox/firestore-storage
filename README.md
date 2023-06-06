# Firestore Storage
[![Build Status](https://github.com/freshfox/firestore-storage/actions/workflows/main.yml/badge.svg)](https://github.com/freshfox/firestore-storage/actions)

Typesafe repositories around Firestore providing a straightforward API to read and write documents.

## Usage
```bash
npm i firestore-storage-core firestore-storage
```

```typescript
import { BaseModel } from 'firebase-storage-core';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp();

// restaurants/{restaurantId}
const restaurantRepo = new RestaurantRepository(getFirestore());

const restaurant = await restaurantRepo.save({
	name: 'FreshFoods',
	type: 'vegan'
});
console.log(restaurant);
/*
{
  id: '0vdxYqEisf5vwJLhyLjA',
  name: 'FreshFoods',
  _rawPath: 'restaurants/0vdxYqEisf5vwJLhyLjA'
}*/

// Query restaurants based on properties
await restaurantRepo.list({
	type: 'vegan'
});

// More complex queries
await restaurantRepo.query((qb) => {
	return qb
		.where((r) => r.type, '==', 'steak')
		.where((r) => r.address.city, '==', 'NY')
});
```
The properties `id` and `_rawPath` from `BaseModel` are dynamically added during reads
and removed before writes.

### Nested collections

When working with nested collections, read and write methods require a parameter
to supply a map of all parent document ids
```typescript
// restaurants/{restaurantId}/reviews/{reviewId}
const reviewRepo = new ReviewRepository(getFirestore());

const review = await reviewRepo.save({
	userId: 'my-user-uid-123',
	stars: 5
}, {
	restaurantId: '0vdxYqEisf5vwJLhyLjA'
});
console.log(review);
/*
{
  id: 'a393f73b884c4a0981c0',
  userId: 'my-user-uid-123',
  stars: 5
  _rawPath: 'restaurants/0vdxYqEisf5vwJLhyLjA/reviews/a393f73b884c4a0981c0'
}*/
```

## Defining collections and repositories

Create repository classes for each collection you want to query documents from. For example,
if you want to query documents to query from the `users` collection you create a class `UserRepository` extending `BaseRepository`.
Each repository provides a list of functions for saving, querying and deleting documents,
and you can extend each repository based on your needs.

```typescript
export namespace Collections  {
  // To define restaurants/{restaurantId}.
  export const Restaurants = new CollectionPath(
    // Name of the collection
    'restaurants',
    // Template variable name and property name on the id map
    'restaurantId');

  // When defining nested collections a few generics are required
  // restaurants/{restaurantId}/reviews/{reviewId}
  export const Restaurants_Reviews = new CollectionPath<
    // Template variable
    'reviewId',
    // Type of the id on the model
    string,
    // Type of the id map from the parent collection
    DocumentIds<typeof Restaurants>
  >(
    // Name of the collection
    'reviews',
    // Template variable name and property name on the id map
    'reviewId',
    // Path of the parent collection
    Restaurants
  );
}
```
```typescript
// Path to document: restaurants/0vdxYqEisf5vwJLhyLjA/reviews/a393f73b884c4a0981c0
Collections.Restaurants_Reviews.doc({
  restaurantId: '0vdxYqEisf5vwJLhyLjA',
  reviewId: 'a393f73b884c4a0981c0'
})

// Path to collection: restaurants/0vdxYqEisf5vwJLhyLjA/reviews
Collections.Restaurants_Reviews.collection({
  restaurantId: '0vdxYqEisf5vwJLhyLjA'
})

// Path template: restaurants/{restaurantId}/reviews/{reviewId}
Collections.Restaurants_Reviews.path();

// Parse ids from path
Collections.Restaurants_Reviews.parse(
  'restaurants/0vdxYqEisf5vwJLhyLjA/reviews/a393f73b884c4a0981c0'
);
/**
 * {
 *   restaurantId: '0vdxYqEisf5vwJLhyLjA',
 *   reviewId: 'a393f73b884c4a0981c0'
 * }
 */
```

### Creating repositories

```typescript
import { BaseRepository } from 'firestore-storage';
import { Repository } from 'firestore-storage-core';

interface Review {
	userId: string;
	stars: number;
}

@Repository({
	path: Collections.Restaurants_Reviews
})
export class ReviewRepository extends BaseRepository<Review, typeof Collections.Restaurants_Reviews> {

	constructor() {
		super(getFirestore());
	}
}
```

### Return value conventions for methods

- `find*()` methods return the document or null when no result was found
- `get*()` methods always return the document and will throw an error when no result was found
- `list*()` methods always return an array and never null. When no result is found, the array is empty
