# firestore-indexes

`firestore-indexes` is a tiny helper class which helps you write indexes for Firestore using Typescript
and lets you generate the corresponding `firestore-indexes.json` file during your build process

## Install
    npm install firestore-indexes

## Usage

```typescript
import {IndexManager, QueryScope} from 'firestore-indexes';

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
  /**/.field(u => u.address.street)
  /**/.add()
  .addIndex<User>('users', QueryScope.Collection)
  /**/.field('address.city')
  /**/.field('address.zip')
  /**/.add()
```
