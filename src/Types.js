/**
 * Types 
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const ARRAY = 0;
const BOOLEAN = 1;
const BUFFER = 2;
const NUMBER = 3;
const STRING = 4;
const SEP = 5;
const INDEX = 6;

/* Methods -------------------------------------------------------------------*/

function resolve(type) {
	type = type.toLowerCase();

	if (type === 'boolean' || type === Boolean) return BOOLEAN;
	if (type === 'buffer' || type === Buffer) return BUFFER;
	if (type === 'number' || type === Number) return NUMBER;
	if (type === 'string' || type === String) return STRING;

	throw new Error('Unrecognized type ' + type);
}

/* Exports -------------------------------------------------------------------*/

module.exports = { ARRAY, BOOLEAN, BUFFER, NUMBER, STRING, SEP, INDEX, resolve };