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
	let keys = Object.keys(schema);
	let bytes = new Workbench(data);

	let _propName;
	let _propType;
	let _caret = 0;

	data.forEach((byte, index) => {
		// SEP
		if (byte === Workbench.SEP_CODE) {
			if (index > 0) {
				_propName = keys[bytes.read(Types.NUMBER, _caret + 1, _caret + 2)];
				_propType = Types.resolve(schema[_propName].type || schema[_propName]);
				result[_propName] = bytes.read(_propType, _caret + 2, index);
			}
			_caret = index;
		}
		if (index === data.length - 1) {
			_propName = keys[bytes.read(Types.NUMBER, _caret + 1, _caret + 2)];
			_propType = Types.resolve(schema[_propName].type || schema[_propName]);
			result[_propName] = bytes.read(_propType, _caret + 2, index + 1);
		}
	});
	
	return result;
}


/* Exports -------------------------------------------------------------------*/

module.exports = Decode;