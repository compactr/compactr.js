/**
 * Types 
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const BOOLEAN = 0;
const BUFFER = 1;
const NUMBER = 2;
const STRING = 3;
const BOOLEAN_ARRAY = 4;
const NUMBER_ARRAY = 5;
const STRING_ARRAY = 6;
const INDEX = 16;

const BOOLEAN_STR = 'boolean';
const BUFFER_STR = 'buffer';
const NUMBER_STR = 'number';
const STRING_STR = 'string';
const OBJECT_STR = 'json';

/* Methods -------------------------------------------------------------------*/

/**
 * Returns the matching id for a data type
 * @param {string|function} type Either a type constructor or name
 * @returns {integer} The matching index
 */
function resolve(type) {
	let name = type.type || type;
	let res = BOOLEAN;
	if (typeof name === STRING_STR) {
		if (name === BUFFER_STR) res = BUFFER;
		else if (name === NUMBER_STR) res = NUMBER;
		else if (name === STRING_STR) res = STRING;
		else if (name === OBJECT_STR) {
			if (type.items === BOOLEAN_STR) res = BOOLEAN_ARRAY;
			else if (type.items === NUMBER_STR) res = NUMBER_ARRAY;
			else res = STRING_ARRAY; // Revert to Stringification of Array elements
		}
	}
	else {
		if (name === Buffer) res = BUFFER;
		else if (name === Number) res = NUMBER;
		else if (name === String) res = STRING;
	}
	
	return res;
}

/* Exports -------------------------------------------------------------------*/

module.exports = { 
	BOOLEAN,
	BUFFER,
	NUMBER,
	STRING,
	BOOLEAN_ARRAY,
	NUMBER_ARRAY,
	STRING_ARRAY,
	INDEX,
	resolve
};