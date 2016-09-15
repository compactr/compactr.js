/**
 * Encoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const ieee754 = require('ieee754');

const Types = require('./Types');

/* Local variables -----------------------------------------------------------*/

// Number ranges and byte sizes
// Reserving 5 characters for separations
const MIN_INT8 = 0;
const MAX_INT8 = 250;
const MIN_INT16 = -32768;
const MAX_INT16 = 32767;
const MIN_INT32 = -2147483648;
const MAX_INT32 = 2147483647;

const ARRAY_SEP_CODE = 253;
const SEP_CODE = 255;
const SCHEMA_SEP_CODE = 254;

const ZERO = 0;
const ONE = 1;

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

	for (let i = len - ONE; i >= ZERO; i--) {
		let key = keys[i];

		if (payload[key] !== undefined && payload[key] !== null) {
			let type = Types.resolve(schema[key]);
			append_index(result, i);
			if (type === Types.BOOLEAN) append_boolean(result, payload[key]);
			else if (type === Types.NUMBER) append_number(result, payload[key]);
			else if (type === Types.STRING) append_string(result, payload[key]);
			else if (type === Types.SCHEMA) {
				if (!nested) {
					append_schema(
						result, 
						payload[key], 
						Types.get_schema(schema[key])
					);
				}
				else throw new Error('Cannot embed schemas at this depth');
			}
			else if (type === Types.BOOLEAN_ARRAY) {
				append_boolean_array(result, payload[key]);
			}
			else if (type === Types.NUMBER_ARRAY) {
				append_number_array(result, payload[key]);
			}
			else if (type === Types.STRING_ARRAY){
				append_string_array(result, payload[key]);
			}
			else if (type === Types.SCHEMA_ARRAY){
				if (!nested) {
					append_schema_array(
						result, 
						payload[key], 
						Types.get_schema(schema[key])
					);
				}
				else throw new Error('Cannot embed schemas at this depth');
			}
		}
	}
	 
	return array_to_buffer(result);
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
		else if (data <= MAX_INT32 && data >= MIN_INT32) {
			append_int32(buffer, data);
		}
		else {
			append_double(buffer, data);
		}
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
 * Appends an Array of Number type values to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {array} data The data to append
 */
function append_number_array(buffer, data) {
	const len = data.length;
	for (let i = ZERO; i < len; i++) {
		if (data[i] !== undefined && data[i] !== null) {
			append_number(buffer, data[i]);
			if (i < len - ONE) append_array_separator(buffer);
		}
	}
}

/**
 * Appends an Array of Boolean type values to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {array} data The data to append
 */
function append_boolean_array(buffer, data) {
	const len = data.length;
	for (let i = ZERO; i < len; i++) {
		if (data[i] !== undefined && data[i] !== null) {
			append_boolean(buffer, data[i]);
		}
	}
}

/**
 * Appends an Array of String type values to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {array} data The data to append
 */
function append_string_array(buffer, data) {
	const len = data.length;
	for (let i = ZERO; i < len; i++) {
		if (data[i] !== undefined && data[i] !== null) {
			append_string(buffer, data[i]);
			if (i < len - ONE) append_array_separator(buffer);
		}
	}
}

/**
 * Appends a Schema type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {array} data The data to append
 * @param {object} schema The child Schema to use
 */
function append_schema(buffer, data, schema) {
	let res = Encode(schema, data, true);
	let len = res.length;

	buffer[buffer.length] = SCHEMA_SEP_CODE;

	for (let i = ZERO; i < len; i++) {
		buffer[buffer.length] = res[i];
	}
	buffer[buffer.length] = SCHEMA_SEP_CODE;
}

/**
 * Appends an Array of Schema type values to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {array} data The data to append
 * @param {object} schema The child Schema to use
 */
function append_schema_array(buffer, data, schema) {
	let len = data.length;
	for (let i = 0; i < len; i++) {
		if (data[i] !== undefined && data[i] !== null) {
			append_schema(buffer, data[i], schema);
		}
	}
}

/**
 * Appends an Array separator charcter to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 */
function append_array_separator(buffer) {
	buffer[buffer.length] = ARRAY_SEP_CODE;
}

/**
 * Appends a Boolean type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_boolean(buffer, data) {
	buffer[buffer.length] = data ? ONE : ZERO;
}

/**
 * Appends a signed INT8 type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_int8(buffer, data) {
	/*if (data < 0) data = 0xff + data + 1;
	buffer[buffer.length] = (data & 0xff);*/
	buffer[buffer.length] = data;
}

/**
 * Appends a signed INT16 type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_int16(buffer, data) {
	buffer[buffer.length] = (data >>> 8);
	buffer[buffer.length] = (data & 0xff);
}

/**
 * Appends a signed INT32 type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_int32(buffer, data) {
	if (data < 0) data = 0xffffffff + data + 1;
	buffer[buffer.length] = (data >>> 24);
	buffer[buffer.length] = (data >>> 16);
	buffer[buffer.length] = (data >>> 8);
	buffer[buffer.length] = (data & 0xff);
}

/**
 * Appends a double type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_double(buffer, data) {
	ieee754.write(buffer, data, buffer.length, false, 52, 8);
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
		buffer[buffer.length] = data.codePointAt(i);
	}
}

/**
 * Appends an index type value to the Buffer [255, x]
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_index(buffer, data) {
	buffer[buffer.length] = SEP_CODE;
	// Unsigned Int
	buffer[buffer.length] = data;
}

/* Exports -------------------------------------------------------------------*/

module.exports = Encode;