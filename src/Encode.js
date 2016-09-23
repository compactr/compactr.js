/**
 * Encoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const ieee754 = require('ieee754');

const Types = require('./Types');

/* Local variables -----------------------------------------------------------*/

const MIN_INT8 = -128;
const MAX_INT8 = 127;
const INT16_SIZE = 2;
const MIN_INT16 = -32768;
const MAX_INT16 = 32767;
const INT32_SIZE = 4;
const MIN_INT32 = -2147483648;
const MAX_INT32 = 2147483647;
const DOUBLE_SIZE = 8;

const ZERO = 0;
const ONE = 1;
const HEX_COMP = 0xff;
const HEX_LARGE = 0xffffffff;
const SHIFT_8 = 8;
const SHIFT_16 = 16;
const SHIFT_24 = 24;

/* Methods -------------------------------------------------------------------*/

/**
 * Encodes a JS object into a Buffer using a Schema
 * @param {object} schema The Schema to use for encoding
 * @param {object} payload The payload to encode
 * @param {boolean} nested Wether this was called for a nested schema
 * @returns {Buffer} The encoded Buffer
 */
function Encode(schema, payload, nested) {
	schema = schema.attributes || schema;	// Waterline Model

	const keys = Object.keys(schema);
	const len = keys.length;

	let result = [];

	for (let i = ZERO; i < len; i++) {
		let key = keys[i];

		if (payload[key] !== undefined && payload[key] !== null) {
			result[result.length] = i;

			append_binary(
				result, 
				Types.resolve(schema[key]), 
				payload[key], 
				schema, 
				key
			);
		}
	}
	
	if (nested) return result;
	return array_to_buffer(result);
}

function append_size16(buffer, value) {
	buffer[buffer.length] = (value >>> SHIFT_8);
    buffer[buffer.length] = (value & HEX_COMP);
}

/**
 * Returns an array of bytes - binary conversion
 * @param {integer} type The data type
 * @param {?} data The data to convert to binary
 * @param {object} schema The schema used to serialize
 * @param {string} key The schema key being encoded
 * @returns {array} The array of bytes
 */
function append_binary(result, type, data, schema, key) {
	if (type === Types.BOOLEAN) from_boolean(result, data);
	else if (type === Types.NUMBER) from_number(result, data);
	else if (type === Types.STRING) from_string(result, data);
	else if (type === Types.SCHEMA) {
		from_schema(result, data, Types.get_schema(schema[key]));
	}
	else if (type === Types.BOOLEAN_ARRAY) {
		from_boolean_array(result, data);
	}
	else if (type === Types.NUMBER_ARRAY) {
		from_number_array(result, data);
	}
	else if (type === Types.STRING_ARRAY) {
		from_string_array(result, data);
	}
	else if (type === Types.SCHEMA_ARRAY){
		from_schema_array(result, data, Types.get_schema(schema[key]));
	}
}

/**
 * Turns an array of UINT8 into a Buffer
 * Faster than Buffer.from because it skips a lot of checks
 * @param {array} data An array of UINT8
 * @returns {Buffer} The resulting Buffer 
 */
function array_to_buffer(data) {
	let len = data.length;
	let res = Buffer.allocUnsafe(len);

	for (let i = ZERO; i < len; i++) {
		res[i] = data[i];
	}

	return res;
}

/**
 * Reads a number as a binary
 * @param {number} data The data to append
 * @returns {array} The binary representation
 */
function from_number(buffer, data) {
	if (isInt(data)) {
		if (data <= MAX_INT8 && data >= MIN_INT8) from_int8(buffer, data);
		else if (data <= MAX_INT16 && data >= MIN_INT16) {
			from_int16(buffer, data);
		}
		else if (data <= MAX_INT32 && data >= MIN_INT32) {
			from_int32(buffer, data);
		}
		else from_double(buffer, data);
	}
	else from_double(buffer, data);
}

/**
 * Super weak bitwise check if a number is an integer. Will not check for
 * variable type or is it's NaN. It would have thrown later down the line anyway
 * and this is way faster.
 * @param {number} value The number to check
 * @returns {boolean} Wether the number is an Integer or a float
 */
function isInt(value) {
 	return (value | ZERO) === value;
}

/**
 * Reads a number array as a binary
 * @param {array} data The data to append
 * @returns {array} The binary representation
 */
function from_number_array(buffer, data) {
	const len = data.length;
	let caret = buffer.length;
	let diff = ZERO;

	// Reserve the counting bytes
	buffer[caret] = ZERO;
	buffer[caret + ONE] = ZERO;
	for (let i = ZERO; i < len; i++) {
		if (data[i] !== undefined && data[i] !== null) {
			from_number(buffer, data[i]);
		}
	}

	diff = buffer.length - caret - INT16_SIZE;
	buffer[caret] = (diff >>> SHIFT_8);
	buffer[caret + ONE] = (diff & HEX_COMP);
}

/**
 * Reads a boolean array as a binary
 * @param {array} data The data to append
 * @returns {array} The binary representation
 */
function from_boolean_array(buffer, data) {
	const len = data.length;
	let caret = buffer.length;

	buffer[caret] = len;
	for (let i = ZERO; i < len; i++) {
		if (data[i] !== undefined && data[i] !== null) {
			buffer[buffer.length] = data[i] ? ONE : ZERO;
		}
	}
}

/**
 * Reads a string array as a binary
 * @param {array} data The data to append
 * @returns {array} The binary representation
 */
function from_string_array(buffer, data) {
	const len = data.length;
	let caret = buffer.length;
	let diff = ZERO;

	// Reserve the counting bytes
	buffer[caret] = ZERO;
	buffer[caret + ONE] = ZERO;
	for (let i = ZERO; i < len; i++) {
		if (data[i] !== undefined && data[i] !== null) {
			from_string(buffer, data[i]);
		}
	}

	diff = buffer.length - caret - INT16_SIZE;
	buffer[caret] = (diff >>> SHIFT_8);
	buffer[caret + ONE] = (diff & HEX_COMP);
}

/**
 * Reads an object as a binary
 * @param {object} data The data to append
 * @returns {array} The binary representation
 */
function from_schema(buffer, data, schema) {
	let res = Encode(schema, data, true);
	const len = res.length;

	append_size16(buffer, len);
	let caret = buffer.length;

	for (let i = ZERO; i < len; i++) {
		buffer[caret + i] = res[i];
	}
}

/**
 * Reads an object as a binary
 * @param {array} data The data to append
 * @returns {array} The binary representation
 */
function from_schema_array(buffer, data, schema) {
	const len = data.length;
	let caret = buffer.length;
	let diff = ZERO;

	// Reserve the counting bytes
	buffer[caret] = ZERO;
	buffer[caret + ONE] = ZERO;

	for (let i = ZERO; i < len; i++) {
		if (data[i] !== undefined && data[i] !== null) {
			from_schema(buffer, data[i], schema);
		}
	}

	diff = buffer.length - caret - INT16_SIZE;
	buffer[caret] = (diff >>> SHIFT_8);
	buffer[caret + ONE] = (diff & HEX_COMP);
}

/**
 * Reads a boolean as a binary
 * @param {boolean} data The data to append
 * @returns {array} The binary representation
 */
function from_boolean(buffer, data) {
	buffer[buffer.length] = ONE;
	buffer[buffer.length] = data ? ONE : ZERO;
}

/**
 * Reads an int8 number as a binary
 * @param {boolean} data The data to append
 * @returns {array} The binary representation
 */
function from_int8(buffer, data) {
	if (data < ZERO) data = HEX_COMP + data + ONE;
	buffer[buffer.length] = ONE;
	buffer[buffer.length] = (data & HEX_COMP);
}

/**
 * Reads an int16 number as a binary
 * @param {boolean} data The data to append
 * @returns {array} The binary representation
 */
function from_int16(buffer, data) {
	let caret = buffer.length;
	buffer[caret] = INT16_SIZE;
	buffer[caret + ONE] = (data >>> SHIFT_8);
	buffer[caret + INT16_SIZE] = (data & HEX_COMP);
}

/**
 * Reads an int32 number as a binary
 * @param {boolean} data The data to append
 * @returns {array} The binary representation
 */
function from_int32(buffer, data) {
	if (data < ZERO) data = HEX_LARGE + data + ONE;

	let caret = buffer.length;
	buffer[caret] = INT32_SIZE;
	buffer[caret + ONE] = (data >>> SHIFT_24);
	buffer[caret + INT16_SIZE] = (data >>> SHIFT_16);
	buffer[caret + 3] = (data >>> SHIFT_8);
	buffer[caret + INT32_SIZE] = (data & HEX_COMP);
}

/**
 * Reads a double number as a binary
 * @param {boolean} data The data to append
 * @returns {array} The binary representation
 */
function from_double(buffer, data) {
	buffer[buffer.length] = DOUBLE_SIZE;
	ieee754.write(buffer, data, buffer.length, false, 52, DOUBLE_SIZE);
}

/**
 * Reads a string as a binary
 * @param {boolean} data The data to append
 * @returns {array} The binary representation
 */
function from_string(buffer, data) {
	data = String(data);

	let len = data.length;
	let caret = buffer.length;

	buffer[caret] = len;
	for (let i = ZERO; i < len; i++) {
		buffer[caret + ONE + i] = data.codePointAt(i);
	}
}

/* Exports -------------------------------------------------------------------*/

module.exports = Encode;