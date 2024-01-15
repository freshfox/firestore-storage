import { DocumentReference, Firestore } from '@google-cloud/firestore';

export abstract class Migrations {
	protected constructor(protected storage: Firestore) {}

	abstract getVersion(): number;

	abstract onUpgrade(toVersion: number): Promise<any>;

	async upgrade() {
		let version = await this.readVersion();
		const targetVersion = this.getVersion();
		console.log(`Current database version (${version}). Target version (${targetVersion})`);
		while (version < targetVersion) {
			console.log(`Upgrading from ${version} to ${version + 1}`);
			version++;
			const label = `Successfully upgraded to ${version}`;
			console.time(label);
			await this.onUpgrade(version);
			await this.writeVersion(version);
			console.timeEnd(label);
		}
	}

	async readVersion(): Promise<number> {
		const data = await this.getDocumentReference().get();
		return data.data()?.version || 0;
	}

	async writeVersion(version: number) {
		await this.getDocumentReference().set(
			{
				version: version,
			},
			{ merge: true }
		);
	}

	// noinspection JSMethodCanBeStatic
	protected getVersionDocumentPath() {
		return 'version/current';
	}

	private getDocumentReference(): DocumentReference<{ version: number }> {
		return this.storage.doc(this.getVersionDocumentPath()) as DocumentReference<{ version: number }>;
	}
}
