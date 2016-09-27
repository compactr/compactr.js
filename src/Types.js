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
const BINARY = 9;
const INDEX = 16;

const BOOLEAN_STR = 'boolean';
const NUMBER_STR = 'number';
const STRING_STR = 'string';
const OBJECT_STR = 'json';
const OBJECT_TYPE = 'object';
const BINARY_STR = 'buffer';

// Small and easy check of data type by first letter (most common ones)
const B_STR = 'b';
const N_STR = 'n';
const S_STR = 's';
const O_STR = 'j';

/* Methods -------------------------------------------------------------------*/

/**
 * Returns the matching id for a data type
 * @param {string|function} type Either a type constructor or name
 * @returns {integer} The matching index
 */
function resolve(type) {
	let name = type.type || type;
	let n = name[0];

	// String type checks
	if (n === B_STR) return BOOLEAN;
	if (n === N_STR) return NUMBER;
	if (n === S_STR) return STRING;
	if (n === O_STR) {
		if (type.items === BOOLEAN_STR) return BOOLEAN_ARRAY;
		if (type.items === NUMBER_STR) return NUMBER_ARRAY;
		if (type.items === STRING_STR) return STRING_ARRAY;
		if (typeof type.items === OBJECT_TYPE) return SCHEMA_ARRAY;
		if (type.schema) return SCHEMA;
	}
	if (name === BINARY_STR) return BINARY;
	
	// Function type checks
	if (name === Boolean) return BOOLEAN;
	if (name === Number) return NUMBER;
	if (name === String) return STRING;
	if (name === Array) {
		if (type.items === Boolean) return BOOLEAN_ARRAY;
		if (type.items === Number) return NUMBER_ARRAY;
		if (type.items === String) return STRING_ARRAY;
		if (typeof type.items === Object) return SCHEMA_ARRAY;
		if (type.schema) return SCHEMA;
	}
	if (name === Buffer) return BINARY;
	// TODO: Full Mongoose schema support
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
	BINARY,
	INDEX,
	resolve,
	get_schema
};