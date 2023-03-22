export interface FirestoreChange<T = any> {
	oldValue: FirestoreChangeValue<T>;
	value: FirestoreChangeValue<T>;
	updateMask: {
		fieldPaths: string[];
	};
}

export interface FirestoreChangeValue<T> extends FirestoreMapValue<T> {
	createTime: string;
	updateTime: string;
	name: string;
}

export interface FirestoreEvent {
	eventId: string;
	eventType: string;
	params: { [key: string]: string };
	resource: string;
	timestamp: string;
}

// https://cloud.google.com/firestore/docs/reference/rest/v1/Value
export interface FirestoreValue {
	nullValue?: null;
	booleanValue?: boolean;
	integerValue?: string;
	doubleValue?: number;
	timestampValue?: string;
	stringValue?: string;
	bytesValue?: string;
	referenceValue?: string;
	arrayValue?: { values: FirestoreValue[] };
	mapValue?: FirestoreMapValue<any>;
}

export type FirestoreMapValue<T> = {
	fields: {
		[K in keyof T]: FirestoreValue;
	};
};

export interface FirestoreDocument<T> {
	id: string;
	createdAt: Date;
	updatedAt: Date;
	data: T;
}

export type FirestoreChangeFunction<T = any> = (
	change: FirestoreChange<T>,
	event: FirestoreEvent
) => Promise<any> | any;
