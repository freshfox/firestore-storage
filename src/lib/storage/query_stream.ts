import {Readable} from "stream";
import {IStorageDriver} from "./storage";

export class QueryStream<T> extends Readable {

	constructor(private storage: IStorageDriver) {
		super();
	}

	_read(size: number) {
		console.log('Reading size', size);
		super._read(size);
	}

}
