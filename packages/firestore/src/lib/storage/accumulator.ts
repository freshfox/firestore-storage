import {StorageEvent, StorageEventType} from "./firestore_storage";
import {EventEmitter} from "events";

export type TrackedEventMap = {[key in StorageEventType]?: { [collection: string]: number;}}

export class StorageEventAccumulator {

	private events: TrackedEventMap = {}

	private readonly trackerFunc;

	constructor(private readonly emitter: EventEmitter) {
		this.trackerFunc = this.track.bind(this);
		emitter.on(StorageEventType.Read, this.trackerFunc);
		emitter.on(StorageEventType.Write, this.trackerFunc);
		emitter.on(StorageEventType.Delete, this.trackerFunc);
	}

	private track(event: StorageEvent) {
		this.events[event.type] = this.events[event.type] || {};
		this.events[event.type][event.collection] = this.events[event.type][event.collection] || 0;
		this.events[event.type][event.collection] += event.count;
	}

	off() {
		this.emitter.off(StorageEventType.Read, this.trackerFunc);
		this.emitter.off(StorageEventType.Write, this.trackerFunc);
		this.emitter.off(StorageEventType.Delete, this.trackerFunc);
	}

	reset() {
		this.events = {};
	}

	get(): TrackedEventMap {
		return this.events;
	}

}
