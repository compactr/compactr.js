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
const DOUBLE_SIZE = 6;

const SEP_CODE = 255;

const allowed_types = ['number', 'boolean', 'string'];

let work_buffer = Buffer.allocUnsafe(MAX_SIZE);

/* Methods -------------------------------------------------------------------*/

/**
 * Encodes a JS object into a Buffer using a Schema
 * @param {object} schema The Schema to use for encoding
 * @param {object} payload The payload to encode
 * @returns {Buffer} The encoded Buffer
 */
function Encode(schema, payload) {
	let result = work_buffer;
	const keys = Object.keys(schema);
	const len = keys.length;
	
	result.caret = 0;

	for (let i = len - 1; i >= 0; i--) {
		let key = keys[i];

		if (is_valid(key, payload)) {
			let type = Types.resolve(schema[key].type || schema[key]);
			append_index(result, i);
			if (type === Types.BOOLEAN) append_boolean(result, payload[key]);
			else if (type === Types.NUMBER) append_number(result, payload[key]);
			else if (type === Types.STRING) append_string(result, payload[key]);
		}
	}
	 
	return result.slice(0, result.caret);
}

/**
 * Returns wether a payload property is valid for encoding
 * If not, it will be skipped
 * @param {string} key The property key to validate
 * @param {object} payload The payload to encode
 * @returns {boolean} Wether the property is valid for encoding
 */
function is_valid(key, payload) {
	if (key in payload) {
		let _type = typeof payload[key];
		return (allowed_types.includes(_type));
	}
	return false;
}

/**
 * Appends a Number type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_number(buffer, data) {
	if (Number.isInteger(data)) {
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
 * Appends a Boolean type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_boolean(buffer, data) {
	buffer[buffer.caret] = data ? 1 : 0;
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
	// Ommit last 2 digits of the double 
	buffer.writeDoubleBE(data, buffer.caret);
	buffer.caret += DOUBLE_SIZE;
}

/**
 * Appends a String type value to the Buffer
 * @param {Buffer} buffer The Buffer to append to
 * @param {number} data The data to append
 */
function append_string(buffer, data) {
	let len = data.length;

	for (let i = 0; i < len; i++) {
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
	buffer[buffer.caret + 1] = data;
	buffer.caret += INT16_SIZE;
}

/* Exports -------------------------------------------------------------------*/

module.exports = Encode;