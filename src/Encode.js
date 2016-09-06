/**
 * Encoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Types = require('./Types');

/* Local variables -----------------------------------------------------------*/

// One frame - all overheads
const MAX_SIZE = 1400;

// Number ranges and byte sizes
const MIN_INT8 = -128;
const MAX_INT8 = 127;
const MIN_INT16 = -32768;
const MAX_INT16 = 32767;
const INT8_SIZE = 1;
const INT16_SIZE = 2;
const INT32_SIZE = 4;
const DOUBLE_SIZE = 8;

const ARRAY_SEP_CODE = 44;
const SEP_CODE = 255;

const ZERO = 0;
const ONE = 1;

const allowed_types = ['number', 'boolean', 'string', 'object'];

let work_buffer = Buffer.allocUnsafe(MAX_SIZE);

/* Methods -------------------------------------------------------------------*/

/**
 * Encodes a JS object into a Buffer using a Schema
 * @param {object} schema The Schema to use for encoding
 * @param {object} payload The payload to encode
 * @returns {Buffer} The encoded Buffer
 */
function Encode(schema, payload) {
	schema = schema.attributes || schema;	// Waterline Model

	const keys = Object.keys(schema);
	const len = keys.length;

	let result = work_buffer;
	
	result.caret = ZERO;

	for (let i = len - ONE; i >= ZERO; i--) {
		let key = keys[i];

		if (payload[key] !== undefined && payload[key] !== null) {
			let type = Types.resolve(schema[key]);
			append_index(result, i);
			if (type === Types.BOOLEAN) append_boolean(result, payload[key]);
			else if (type === Types.NUMBER) append_number(result, payload[key]);
			else if (type === Types.STRING) append_string(result, payload[key]);
			else if (type === Types.BOOLEAN_ARRAY) {
				append_boolean_array(result, payload[key]);
			}
			else if (type === Types.NUMBER_ARRAY) {
				append_number_array(result, payload[key]);
			}
			else {
				append_string_array(result, payload[key]);
			}
		}
	}
	 
	return result.slice(ZERO, result.caret);
}

/**
 * Appends a Number type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 * @returns {integer} The number of bytes written
 */
function append_number(buffer, data) {
	if (isInt(data)) {
		if (data <= MAX_INT8 && data >= MIN_INT8) {
			append_int8(buffer, data);
		}
		else if (data <= MAX_INT16 && data >= MIN_INT16) {
			append_int16(buffer, data);
		}
		else append_int32(buffer, data);
	}
	else append_double(buffer, data);
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
 * Appends an Array of  Number type values to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {array} data The data to append
 */
function append_number_array(buffer, data) {
	const len = data.length;
	for (let i = ZERO; i < len; i++) {
		append_number(buffer, data[i]);
		if (i < len - ONE) append_array_separator(buffer);
	}
}

/**
 * Appends an Array of  Boolean type values to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {array} data The data to append
 */
function append_boolean_array(buffer, data) {
	const len = data.length;
	for (let i = ZERO; i < len; i++) {
		append_boolean(buffer, data[i]);
		if (i < len - ONE) append_array_separator(buffer);
	}
}

/**
 * Appends an Array of  String type values to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {array} data The data to append
 */
function append_string_array(buffer, data) {
	const len = data.length;
	for (let i = ZERO; i < len; i++) {
		append_string(buffer, data[i]);
		if (i < len - ONE) append_array_separator(buffer);
	}
}

/**
 * Appends an Array separator charcter to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 */
function append_array_separator(buffer) {
	buffer[buffer.caret] = ARRAY_SEP_CODE;
	buffer.caret += INT8_SIZE;
}

/**
 * Appends a Boolean type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_boolean(buffer, data) {
	buffer[buffer.caret] = data ? ONE : ZERO;
	buffer.caret += INT8_SIZE;
}

/**
 * Appends a signed INT8 type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_int8(buffer, data) {
	buffer.writeInt8(data, buffer.caret);
	buffer.caret += INT8_SIZE;
}

/**
 * Appends a signed INT16 type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_int16(buffer, data) {
	buffer.writeInt16BE(data, buffer.caret);
	buffer.caret += INT16_SIZE;
}

/**
 * Appends a signed INT32 type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_int32(buffer, data) {
	buffer.writeInt32BE(data, buffer.caret);
	buffer.caret += INT32_SIZE;
}

/**
 * Appends a double type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_double(buffer, data) {
	buffer.writeDoubleBE(data, buffer.caret);
	buffer.caret += DOUBLE_SIZE;
}

/**
 * Appends a String type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_string(buffer, data) {
	data = String(data);
	let len = data.length;

	for (let i = ZERO; i < len; i++) {
		buffer[buffer.caret + i] = data.codePointAt(i);
	}
	buffer.caret += len;
}

/**
 * Appends an index type value to the Buffer [255, x]
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_index(buffer, data) {
	buffer[buffer.caret] = SEP_CODE;
	// Unsigned Int
	buffer[buffer.caret + ONE] = data;
	buffer.caret += INT16_SIZE;
}

/* Exports -------------------------------------------------------------------*/

module.exports = Encode;