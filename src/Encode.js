/**
 * Encoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const ieee754 = require('ieee754');

const Types = require('./Types');

/* Constants -----------------------------------------------------------------*/

const PREALLOC_DEPTH = 4;

/* Methods -------------------------------------------------------------------*/

class Encoder {

	/**
	 * Encodes a JS object into a Buffer using a Schema
	 * @param {object} schema The Schema to use for encoding
	 */
	constructor() {
		this.keys = [];

		this.result = [];
		this.caret = 0;
		this.schema = {};
	}

	/**
	 * Processes a payload and returns the buffer representation
	 * @param {object} payload The payload to encode
	 * @param {boolean} nested Wether the encoding is for a nested object
	 * @param {Buffer|array} The result of the encoding
	 */
	init(schema, payload, nested) {
		this.keys = Object.keys(schema);

		this.caret = 0;
		this.schema = schema.attributes || schema;
		this.nesting = nested;

		const len = this.keys.length;

		for (let i = 0; i < len; i++) {
			let key = this.keys[i];

			if (payload[key] !== undefined && payload[key] !== null) {
				this.result[this.caret] = i;
				this.caret++;

				this.append_binary(
					Types.resolve(this.schema[key]), 
					payload[key],  
					key
				);
			}
		}
		
		this.result.length = this.caret; // Clip results - unsafe alloc
		if (nested > 0) return this.result;
		return this.array_to_buffer(this.result);
	}

	/**
	 * Appends a UINT16 value to the result
	 * @param {number} value The size of an object to add to the result
	 */
	append_size16(value) {
		this.result[this.caret] = (value >>> 8);
	    this.result[this.caret + 1] = (value & 0xff);

	    this.caret = this.caret + 2;
	}

	/**
	 * Returns an array of bytes - binary conversion
	 * @param {integer} type The data type
	 * @param {?} data The data to convert to binary
	 * @param {string} key The schema key being encoded
	 */
	append_binary(type, data, key) {
		if (type === Types.BOOLEAN) return this.from_boolean(data);
		else if (type === Types.NUMBER) return this.from_number(data);
		else if (type === Types.STRING) return this.from_string(data);
		else if (type === Types.SCHEMA) {
			return this.from_schema(data, Types.get_schema(this.schema[key]));
		}
		else if (type === Types.BOOLEAN_ARRAY) {
			return this.from_boolean_array(data);
		}
		else if (type === Types.NUMBER_ARRAY) {
			return this.from_number_array(data);
		}
		else if (type === Types.STRING_ARRAY) {
			return this.from_string_array(data);
		}
		else if (type === Types.SCHEMA_ARRAY){
			return this.from_schema_array(data, Types.get_schema(this.schema[key]));
		}
		else if (type === Types.BINARY) {
			return this.from_binary(data);
		}
	}

	/**
	 * Turns the result array of UINT8 into a Buffer
	 * Faster than Buffer.from because it skips a lot of checks
	 * @returns {Buffer} The resulting Buffer 
	 */
	array_to_buffer() {
		let res = Buffer.allocUnsafe(this.caret);

		for (let i = 0; i < this.caret; i++) {
			res[i] = this.result[i];
		}

		return res;
	}

	/**
	 * Reads a number as a binary
	 * @param {number} data The data to append
	 */
	from_number(data) {
		if (this.isInt(data)) {
			if (data <= 127 && data >= -128) this.from_int8(data);
			else if (data <= 32767 && data >= -32768) this.from_int16(data);
			else if (data <= 2147483647 && data >= -2147483648) this.from_int32(data);
			else this.from_double(data);
		}
		else this.from_double(data);
	}

	/**
	 * Super weak bitwise check if a number is an integer. Will not check for
	 * variable type or is it's NaN. It would have thrown later down the line anyway
	 * and this is way faster.
	 * @param {number} value The number to check
	 * @returns {boolean} Wether the number is an Integer or a float
	 */
	isInt(value) {
	 	return (value | 0) === value;
	}

	/**
	 * Reads a number array as a binary
	 * @param {array} data The data to append
	 */
	from_number_array(data) {
		const len = data.length;
		let curr = this.caret;
		let diff = 0;

		// Reserve the counting bytes
		this.result[this.caret] = 0;
		this.result[this.caret + 1] = 0;
		this.caret = this.caret + 2;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				this.from_number(data[i]);
			}
		}

		diff = this.caret - curr - 2;
		this.result[curr] = (diff >>> 8);
		this.result[curr + 1] = (diff & 0xff);
	}

	/**
	 * Reads a boolean array as a binary
	 * @param {array} data The data to append
	 */
	from_boolean_array(data) {
		const len = data.length;

		this.result[this.caret] = len;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				this.result[this.caret + i + 1] = data[i] ? 1 : 0;
			}
		}
		this.caret = this.caret + len + 1;
	}

	/**
	 * Reads a string array as a binary
	 * @param {array} data The data to append
	 */
	from_string_array(data) {
		const len = data.length;
		let curr = this.caret;
		let diff = 0;

		// Reserve the counting bytes
		this.result[this.caret] = 0;
		this.result[this.caret + 1] = 0;
		this.caret = this.caret + 2;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				this.from_string(data[i]);
			}
		}

		diff = this.caret - curr - 2;
		this.result[curr] = (diff >>> 8);
		this.result[curr + 1] = (diff & 0xff);
	}

	/**
	 * Reads an object as a binary
	 * @param {object} data The data to append
	 */
	from_schema(data, schema) {
		let res = encode(schema, data, this.nesting + 1);
		const len = res.length;

		this.append_size16(len);

		for (let i = 0; i < len; i++) {
			this.result[this.caret + i] = res[i];
		}
		this.caret = this.caret + len;
	}

	/**
	 * Reads a binary
	 * @param {object} data The data to append
	 */
	from_binary(data) {
		const len = data.length;

		this.append_size16(len);

		for (let i = 0; i < len; i++) {
			this.result[this.caret + i] = data[i];
		}
		this.caret = this.caret + len;
	}

	/**
	 * Reads an object as a binary
	 * @param {array} data The data to append
	 */
	from_schema_array(data, schema) {
		const len = data.length;
		let curr = this.caret;
		let diff = 0;

		// Reserve the counting bytes
		this.result[this.caret] = 0;
		this.result[this.caret + 1] = 0;
		this.caret = this.caret + 2;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				this.from_schema(data[i], schema);
			}
		}

		diff = this.caret - curr - 2;
		this.result[curr] = (diff >>> 8);
		this.result[curr + 1] = (diff & 0xff);
	}

	/**
	 * Reads a boolean as a binary
	 * @param {boolean} data The data to append
	 */
	from_boolean(data) {
		this.result[this.caret] = 1;
		this.result[this.caret + 1] = data ? 1 : 0;
		this.caret = this.caret + 2;
	}

	/**
	 * Reads an int8 number as a binary
	 * @param {boolean} data The data to append
	 */
	from_int8(data) {
		if (data < 0) data = 0xff + data + 1;
		this.result[this.caret] = 1;
		this.result[this.caret + 1] = (data & 0xff);
		this.caret = this.caret + 2;
	}

	/**
	 * Reads an int16 number as a binary
	 * @param {boolean} data The data to append
	 */
	from_int16(data) {
		this.result[this.caret] = 2;
		this.result[this.caret + 1] = (data >>> 8);
		this.result[this.caret + 2] = (data & 0xff);
		this.caret = this.caret + 3;
	}

	/**
	 * Reads an int32 number as a binary
	 * @param {boolean} data The data to append
	 */
	from_int32(data) {
		if (data < 0) data = 0xffffffff + data + 1;

		this.result[this.caret] = 4;
		this.result[this.caret + 1] = (data >>> 24);
		this.result[this.caret + 2] = (data >>> 16);
		this.result[this.caret + 3] = (data >>> 8);
		this.result[this.caret + 4] = (data & 0xff);
		this.caret = this.caret + 5;
	}

	/**
	 * Reads a double number as a binary
	 * @param {boolean} data The data to append
	 * @returns {array} The binary representation
	 */
	from_double(data) {
		this.result[this.caret] = 8;
		ieee754.write(this.result, data, this.caret + 1, false, 52, 8);
		this.caret = this.caret + 9;
	}

	/**
	 * Reads a string as a binary
	 * @param {boolean} data The data to append
	 * @returns {array} The binary representation
	 */
	from_string(data) {
		data = '' + data;

		let len = data.length;

		this.result[this.caret] = len;
		for (let i = 0; i < len; i++) {
			this.result[this.caret + 1 + i] = data.codePointAt(i);
		}
		this.caret = this.caret + len + 1;
	}
}

/* In-memory -----------------------------------------------------------------*/

const _encoders_pool = [];

// Pre-populate with 4 levels of nested encoders
// These will live in memory, a small cost for added speed
for (let i = 0; i < PREALLOC_DEPTH; i++) {
	_encoders_pool[i] = new Encoder();
}

/**
 * Encoder class wrapper
 */
function encode(schema, payload, nested = 0) {
	let _encoder;

	if (nested < PREALLOC_DEPTH) _encoder = _encoders_pool[nested];
	else _encoder = new Encoder();

	return _encoder.init(schema, payload, nested);
}

/* Exports -------------------------------------------------------------------*/

module.exports = encode;