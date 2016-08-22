/**
 * Encoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Workbench = require('./Workbench');
const Types = require('./Types');

/* Methods -------------------------------------------------------------------*/

function Encode(schema, obj) {
	let result = new Workbench();
	const keys = Object.keys(schema);
	const len = keys.length;

	for (let i = len - 1; i >= 0; i--) {
		let key = keys[i];
		if (key in obj && obj[key] !== null && obj[key] !== undefined) {
			let _type = schema[key].type || schema[key];
			result.append(Types.SEP);
			result.append(Types.INDEX, i);
			result.append(Types.resolve(_type), obj[key]);
		}
	}
	
	return result.read(Types.BUFFER, 0, result.caret);
}


/* Exports -------------------------------------------------------------------*/

module.exports = Encode;