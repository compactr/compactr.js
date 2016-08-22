/**
 * Decoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Workbench = require('./Workbench');
const Types = require('./Types');

/* Methods -------------------------------------------------------------------*/

function Decode(schema, data) {
	let result = {};
	const keys = Object.keys(schema);
	let bytes = new Workbench(data);

	const len = data.length;
	const read_skip = 2;
	let _caret = len;

	for (let i = len - 1; i >= 0; i--) {
		if (data[i] === Workbench.SEP_CODE) {
			let _propName = keys[bytes.read(Types.INDEX, i + 1, i + read_skip)];
			if (_propName !== undefined && schema[_propName] !== undefined) {
				let _propType = Types.resolve(schema[_propName].type || schema[_propName]);
				result[_propName] = bytes.read(_propType, i + read_skip, _caret);
				_caret = i;
				i -= read_skip;
			}
		}		
	}
	
	return result;
}


/* Exports -------------------------------------------------------------------*/

module.exports = Decode;