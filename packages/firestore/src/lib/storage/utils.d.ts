import * as admin from "firebase-admin";
import { Change, EventContext } from 'firebase-functions';
import QueryDocumentSnapshot = admin.firestore.QueryDocumentSnapshot;
import DocumentSnapshot = admin.firestore.DocumentSnapshot;
import { BaseModel, ParsedChange, ParsedSnapshot } from "firestore-storage-core";
/**
 * Takes the Firestore change and event context of a Firestore function hook, parses the data and returns a typed result.
 * Pass the path ids ordered by their hierarchical position. The last id will be written on the returned before and after models
 * @param change - Change of the Firestore function
 * @param context - Event context of the Firestore function
 * @param firstId - First and required path id
 * @param idNames - Additional path ids
 */
export declare function parseFirestoreChange<T extends BaseModel, K extends keyof any>(change: Change<QueryDocumentSnapshot<T> | DocumentSnapshot<T>>, context: EventContext, firstId: K, ...idNames: K[]): ParsedChange<T, K>;
export declare function parseFirestoreSnapshot<T extends BaseModel, K extends keyof any>(snapshot: QueryDocumentSnapshot<T>, context: EventContext, firstId: K, ...idNames: K[]): ParsedSnapshot<T, K>;
//# sourceMappingURL=utils.d.ts.map