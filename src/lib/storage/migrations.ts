import {FirestoreStorage} from './firestore_storage';
import {injectable} from 'inversify';

@injectable()
export abstract class Migrations {

	protected constructor(protected storage: FirestoreStorage){}

	abstract getVersion(): number;

	abstract onUpgrade(toVersion: number);

	async upgrade() {
		const snapshot = await this.storage.findById('version', 'current');
		let version = 0;
		if (snapshot) {
			version = snapshot.version || 0;
		}

		while (version < this.getVersion()) {
			console.log(`Upgrading from ${version} to ${version + 1}`);
			version++;
			const label = `Successfully upgraded to ${version}`;
			console.time(label);
			await this.onUpgrade(version);
			await this.storage.save(`version`, {
				id: 'current',
				version: version
			});
			console.timeEnd(label);
		}
	}


}
