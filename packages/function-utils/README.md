# Firestore Function Utils
[![npm version](https://badge.fury.io/js/firestore-function-utils.svg)](https://badge.fury.io/js/firestore-function-utils)


## Overview
This zero dependency package includes some utility functions and types for writing
Google Cloud Function triggers for Firestore.

## Example

```typescript
export function onUserChange(change: FirestoreChange<T>, event: FirestoreEvent) {
    const before = parseFirestoreChangeValue('userId', change, event);
    const after = parseFirestoreChangeValue('userId', change, event);
    console.log(before);
    /*
    {
      id: "0vdxYqEisf5vwJLhyLjA"
      createdAt: Date('2019-04-29T16:35:33.195Z'),
  	  updatedAt: Date('2019-04-29T16:35:33.195Z'),
  	  data: {
  	  	username: 'johndoe',
  	  	gender: 'male',
  	  	newsletter: true
  	  }
    }
     */

}
```
