/**
 * Types 
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const BOOLEAN = 1;
const NUMBER = 2;
const STRING = 3;
const BOOLEAN_ARRAY = 4;
const NUMBER_ARRAY = 5;
const STRING_ARRAY = 6;
const SCHEMA = 7;
const SCHEMA_ARRAY = 8;
const EMBEDDED_JSON = 9;
const INDEX = 16;

const BOOLEAN_STR = 'boolean';
const NUMBER_STR = 'number';
const STRING_STR = 'string';
const OBJECT_STR = 'json';
const OBJECT_TYPE = 'object';

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
		if (name === NUMBER_STR) res = NUMBER;
		else if (name === STRING_STR) res = STRING;
		else if (name === OBJECT_STR) {
			if (type.items === BOOLEAN_STR) res = BOOLEAN_ARRAY;
			else if (type.items === NUMBER_STR) res = NUMBER_ARRAY;
			else if (type.items === STRING_STR) res = STRING_ARRAY;
			else if (typeof type.items === OBJECT_TYPE) res = SCHEMA_ARRAY;
			else if (type.schema) res = SCHEMA;
		}
	}
	else {
		if (name === Number) res = NUMBER;
		else if (name === String) res = STRING;
		else if (name === Array) {
			if (type.items === Boolean) res = BOOLEAN_ARRAY;
			else if (type.items === Number) res = NUMBER_ARRAY;
			else if (type.items === String) res = STRING_ARRAY;
			else if (typeof type.items === Object) res = SCHEMA_ARRAY;
			else if (type.schema) res = SCHEMA;
		}
		// TODO: Full Mongoose schema support
	}
	
	return res;
}

function get_schema(type) {
	return type.schema || type.items;
}

/* Exports -------------------------------------------------------------------*/

module.exports = { 
	BOOLEAN,
	NUMBER,
	STRING,
	BOOLEAN_ARRAY,
	NUMBER_ARRAY,
	STRING_ARRAY,
	SCHEMA,
	SCHEMA_ARRAY,
	INDEX,
	resolve,
	get_schema
};