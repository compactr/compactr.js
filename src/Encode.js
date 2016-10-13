/**
 * Encoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const ieee754 = require('ieee754');

const Types = require('./Types');

/* Methods -------------------------------------------------------------------*/

class Encoder {

	static encode(schema, payload, nested) {
		let job = {
			keys: Object.keys(schema),
			result: [],
			caret: 0,
			schema: schema.attributes || schema,
			nesting: nested || 0
		};

		const len = job.keys.length;

		for (let i = 0; i < len; i++) {
			let key = job.keys[i];

			if (payload[key] !== undefined && payload[key] !== null) {
				job.result[job.caret] = i;
				job.caret++;

				Encoder.append_binary(
					job,
					Types.resolve(job.schema[key]), 
					payload[key],  
					key
				);
			}
		}
		
		if (job.nesting > 0) return job.result;
		return Encoder.array_to_buffer(job);
	}

	/**
	 * Appends a UINT16 value to the result
	 * @param {number} value The size of an object to add to the result
	 */
	static append_size16(job, value) {
		job.result[job.caret] = (value >>> 8);
	    job.result[job.caret + 1] = (value & 0xff);

	    job.caret = job.caret + 2;
	}

	/**
	 * Returns an array of bytes - binary conversion
	 * @param {integer} type The data type
	 * @param {?} data The data to convert to binary
	 * @param {string} key The schema key being encoded
	 */
	static append_binary(job, type, data, key) {
		if (type === Types.BOOLEAN) return Encoder.from_boolean(job, data);
		else if (type === Types.NUMBER) return Encoder.from_number(job, data);
		else if (type === Types.STRING) return Encoder.from_string(job, data);
		else if (type === Types.SCHEMA) {
			return Encoder.from_schema(
				job, 
				data, 
				Types.get_schema(job.schema[key])
			);
		}
		else if (type === Types.BOOLEAN_ARRAY) {
			return Encoder.from_boolean_array(job, data);
		}
		else if (type === Types.NUMBER_ARRAY) {
			return Encoder.from_number_array(job, data);
		}
		else if (type === Types.STRING_ARRAY) {
			return Encoder.from_string_array(job, data);
		}
		else if (type === Types.SCHEMA_ARRAY){
			return Encoder.from_schema_array(
				job, 
				data, 
				Types.get_schema(job.schema[key])
			);
		}
		else if (type === Types.BINARY) {
			return Encoder.from_binary(job, data);
		}
	}

	/**
	 * Turns the result array of UINT8 into a Buffer
	 * Faster than Buffer.from because it skips a lot of checks
	 * @returns {Buffer} The resulting Buffer 
	 */
	static array_to_buffer(job) {
		let res = Buffer.allocUnsafe(job.caret);

		for (let i = 0; i < job.caret; i++) {
			res[i] = job.result[i];
		}

		return res;
	}

	/**
	 * Reads a number as a binary
	 * @param {number} data The data to append
	 */
	static from_number(job, data) {
		if (Encoder.isInt(data)) {
			if (data <= 127 && data >= -128) {
				Encoder.from_int8(job, data);
			}
			else if (data <= 32767 && data >= -32768) {
				Encoder.from_int16(job, data);
			}
			else if (data <= 2147483647 && data >= -2147483648) {
				Encoder.from_int32(job, data);
			}
			else Encoder.from_double(job, data);
		}
		else Encoder.from_double(job, data);
	}

	/**
	 * Super weak bitwise check if a number is an integer. Will not check for
	 * variable type or is it's NaN. It would have thrown later down the line anyway
	 * and this is way faster.
	 * @param {number} value The number to check
	 * @returns {boolean} Wether the number is an Integer or a float
	 */
	static isInt(value) {
	 	return (value | 0) === value;
	}

	/**
	 * Reads a number array as a binary
	 * @param {array} data The data to append
	 */
	static from_number_array(job, data) {
		const len = data.length;
		let curr = job.caret;
		let diff = 0;

		// Reserve the counting bytes
		job.result[job.caret] = 0;
		job.result[job.caret + 1] = 0;
		job.caret = job.caret + 2;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				Encoder.from_number(job, data[i]);
			}
		}

		diff = job.caret - curr - 2;
		job.result[curr] = (diff >>> 8);
		job.result[curr + 1] = (diff & 0xff);
	}

	/**
	 * Reads a boolean array as a binary
	 * @param {array} data The data to append
	 */
	static from_boolean_array(job, data) {
		const len = data.length;

		job.result[job.caret] = len;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				job.result[job.caret + i + 1] = data[i] ? 1 : 0;
			}
		}
		job.caret = job.caret + len + 1;
	}

	/**
	 * Reads a string array as a binary
	 * @param {array} data The data to append
	 */
	static from_string_array(job, data) {
		const len = data.length;
		let curr = job.caret;
		let diff = 0;

		// Reserve the counting bytes
		job.result[job.caret] = 0;
		job.result[job.caret + 1] = 0;
		job.caret = job.caret + 2;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				Encoder.from_string(job, data[i]);
			}
		}

		diff = job.caret - curr - 2;
		job.result[curr] = (diff >>> 8);
		job.result[curr + 1] = (diff & 0xff);
	}

	/**
	 * Reads an object as a binary
	 * @param {object} data The data to append
	 */
	static from_schema(job, data, schema) {
		let res = Encoder.encode(schema, data, job.nesting + 1);
		const len = res.length;

		Encoder.append_size16(job, len);

		for (let i = 0; i < len; i++) {
			job.result[job.caret + i] = res[i];
		}
		job.caret = job.caret + len;
	}

	/**
	 * Reads a binary
	 * @param {object} data The data to append
	 */
	static from_binary(job, data) {
		const len = data.length;

		Encoder.append_size16(job, len);

		for (let i = 0; i < len; i++) {
			job.result[job.caret + i] = data[i];
		}
		job.caret = job.caret + len;
	}

	/**
	 * Reads an object as a binary
	 * @param {array} data The data to append
	 */
	static from_schema_array(job, data, schema) {
		const len = data.length;
		let curr = job.caret;
		let diff = 0;

		// Reserve the counting bytes
		job.result[job.caret] = 0;
		job.result[job.caret + 1] = 0;
		job.caret = job.caret + 2;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				Encoder.from_schema(job, data[i], schema);
			}
		}

		diff = job.caret - curr - 2;
		job.result[curr] = (diff >>> 8);
		job.result[curr + 1] = (diff & 0xff);
	}

	/**
	 * Reads a boolean as a binary
	 * @param {boolean} data The data to append
	 */
	static from_boolean(job, data) {
		job.result[job.caret] = 1;
		job.result[job.caret + 1] = data ? 1 : 0;
		job.caret = job.caret + 2;
	}

	/**
	 * Reads an int8 number as a binary
	 * @param {boolean} data The data to append
	 */
	static from_int8(job, data) {
		if (data < 0) data = 0xff + data + 1;
		job.result[job.caret] = 1;
		job.result[job.caret + 1] = (data & 0xff);
		job.caret = job.caret + 2;
	}

	/**
	 * Reads an int16 number as a binary
	 * @param {boolean} data The data to append
	 */
	static from_int16(job, data) {
		job.result[job.caret] = 2;
		job.result[job.caret + 1] = (data >>> 8);
		job.result[job.caret + 2] = (data & 0xff);
		job.caret = job.caret + 3;
	}

	/**
	 * Reads an int32 number as a binary
	 * @param {boolean} data The data to append
	 */
	static from_int32(job, data) {
		if (data < 0) data = 0xffffffff + data + 1;

		job.result[job.caret] = 4;
		job.result[job.caret + 1] = (data >>> 24);
		job.result[job.caret + 2] = (data >>> 16);
		job.result[job.caret + 3] = (data >>> 8);
		job.result[job.caret + 4] = (data & 0xff);
		job.caret = job.caret + 5;
	}

	/**
	 * Reads a double number as a binary
	 * @param {boolean} data The data to append
	 * @returns {array} The binary representation
	 */
	static from_double(job, data) {
		job.result[job.caret] = 8;
		ieee754.write(job.result, data, job.caret + 1, false, 52, 8);
		job.caret = job.caret + 9;
	}

	/**
	 * Reads a string as a binary
	 * @param {boolean} data The data to append
	 * @returns {array} The binary representation
	 */
	static from_string(job, data) {
		data = '' + data;

		let len = data.length;

		job.result[job.caret] = len;
		for (let i = 0; i < len; i++) {
			job.result[job.caret + 1 + i] = data.codePointAt(i);
		}
		job.caret = job.caret + len + 1;
	}
}

/* Exports -------------------------------------------------------------------*/

module.exports = Encoder.encode;