#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const {IndexManager} = require('../dist/lib/storage/index_manger')

const args = [...process.argv];
args.splice(0, 2);
const command = args.splice(0, 1)[0];

const commands = {
	'generate:index': (input, output) => {
		if (!input || !output) {
			console.error('Missing parameters');
			console.log('Usage: $ fss generate:index <input.js> <output.json>');
			process.exit(1);
		}

		console.log('Loading ' + input);
		const {indexManager} = require(path.join(process.cwd(), input));
		if (!(indexManager instanceof IndexManager)) {
			console.error(input + ' must export a variable called `indexManager` which is an IndexManager instance');
			process.exit(1);
		}
		console.log('Writing to ' + output);
		const json = indexManager.toJSON(2);
		fs.writeFileSync(path.join(process.cwd(), output), json, 'utf8');
	}
}

const func = commands[command];

if (func) {
	func(...args);
} else {
	console.error(`Unrecognised command ${command}. Available commands:\n${Object.keys(commands).map(c => `  - ${c}`).join('\n')}`);
	process.exit(1);
}
