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
	
	Object.keys(schema).forEach((key, index) => {
		if (obj[key]) {
			let _type = schema[key].type || schema[key];
			result.append(Types.SEP);
			result.append(Types.NUMBER, index);
			result.append(Types.resolve(_type), obj[key]);
		}
	});
	
	return result.read(Types.BUFFER);
}


/* Exports -------------------------------------------------------------------*/

module.exports = Encode;