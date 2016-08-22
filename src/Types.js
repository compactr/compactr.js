/**
 * Types 
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const BOOLEAN = 0;
const BUFFER = 1;
const NUMBER = 2;
const STRING = 3;
const INDEX = 4;

const BOOLEAN_STR = 'boolean';
const BUFFER_STR = 'buffer';
const NUMBER_STR = 'number';
const STRING_STR = 'string';

/* Methods -------------------------------------------------------------------*/

function resolve(type) {
	let res = BOOLEAN;
	if (typeof type === STRING_STR) {
		type = type.toLowerCase();

		if (type === BUFFER_STR) res = BUFFER;
		else if (type === NUMBER_STR) res = NUMBER;
		else if (type === STRING_STR) res = STRING;
	}
	else {
		if (type === Buffer) res = BUFFER;
		else if (type === Number) res = NUMBER;
		else if (type === String) res = STRING;
	}
	
	return res;
}

/* Exports -------------------------------------------------------------------*/

module.exports = { BOOLEAN, BUFFER, NUMBER, STRING, INDEX, resolve };