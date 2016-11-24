/**
 * Encoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const ieee754 = require('ieee754');

/* Methods -------------------------------------------------------------------*/

function encode(schema, payload, nested) {
	const job = {
		keys: Object.keys(schema),
		transforms: Object.keys(schema).map((key) => schema[key].type || schema[key]),
		result: [],
		caret: 0,
		schema: schema,
		nesting: nested || 0
	};

	const len = job.keys.length;

	for (let i = 0; i < len; i++) {
		let key = job.keys[i];

		if (payload[key] !== undefined && payload[key] !== null) {
			job.result[job.caret] = i;
			job.caret++;

			let transform = job.transforms[i];
			console.log('encode',transform);
			transforms[transform](job, payload[key], key);
		}
	}
		
	if (job.nesting > 0) return job.result;
	return array_to_buffer(job);
}

/**
 * Turns the result array of UINT8 into a Buffer
 * Faster than Buffer.from because it skips a lot of checks
 * @returns {Buffer} The resulting Buffer 
 */
function array_to_buffer(job) {
	let res = Buffer.allocUnsafe(job.caret);

	for (let i = 0; i < job.caret; i++) {
		res[i] = job.result[i];
	}

	return res;
}

/**
 * Super weak bitwise check if a number is an integer. Will not check for
 * variable type or is it's NaN. It would have thrown later down the line anyway
 * and this is way faster.
 * @param {number} value The number to check
 * @returns {boolean} Wether the number is an Integer or a float
 */
function isInt(value) {
 	return (value | 0) === value;
}

/**
 * Appends a UINT16 value to the result
 * @param {number} value The size of an object to add to the result
 */
function append_size16(job, value) {
	job.result[job.caret] = (value >>> 8);
    job.result[job.caret + 1] = (value & 0xff);
    job.caret = job.caret + 2;
}

const transforms = {
	/**
	 * Reads a number as a binary
	 * @param {number} data The data to append
	 */
	number: (job, data) => {
		if (isInt(data)) {
			if (data <= 127 && data >= -128) {
				transforms.int8(job, data);
			}
			else if (data <= 32767 && data >= -32768) {
				transforms.int16(job, data);
			}
			else if (data <= 2147483647 && data >= -2147483648) {
				transforms.int32(job, data);
			}
			else transforms.double(job, data);
		}
		else transforms.double(job, data);
	},

	/**
	 * Reads a number array as a binary
	 * @param {array} data The data to append
	 */
	number_array: (job, data) => {
		const len = data.length;
		let curr = job.caret;
		let diff = 0;

		// Reserve the counting bytes
		job.result[job.caret] = 0;
		job.result[job.caret + 1] = 0;
		job.caret = job.caret + 2;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				transforms.number(job, data[i]);
			}
		}

		diff = job.caret - curr - 2;
		job.result[curr] = (diff >>> 8);
		job.result[curr + 1] = (diff & 0xff);
	},

	/**
	 * Reads a boolean array as a binary
	 * @param {array} data The data to append
	 */
	boolean_array: (job, data) => {
		const len = data.length;

		job.result[job.caret] = len;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				job.result[job.caret + i + 1] = data[i] ? 1 : 0;
			}
		}
		job.caret = job.caret + len + 1;
	},

	/**
	 * Reads a string array as a binary
	 * @param {array} data The data to append
	 */
	string_array: (job, data) => {
		const len = data.length;
		let curr = job.caret;
		let diff = 0;

		// Reserve the counting bytes
		job.result[job.caret] = 0;
		job.result[job.caret + 1] = 0;
		job.caret = job.caret + 2;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				transforms.string(job, data[i]);
			}
		}

		diff = job.caret - curr - 2;
		job.result[curr] = (diff >>> 8);
		job.result[curr + 1] = (diff & 0xff);
	},

	/**
	 * Reads an object as a binary
	 * @param {object} data The data to append
	 */
	schema: (job, data, key) => {
		const schema = job.schema[key].schema || job.schema[key];
		let res = encode(schema, data, job.nesting + 1);
		const len = res.length;

		append_size16(job, len);

		for (let i = 0; i < len; i++) {
			job.result[job.caret + i] = res[i];
		}
		job.caret = job.caret + len;
	},

	/**
	 * Reads a binary
	 * @param {object} data The data to append
	 */
	binary: (job, data) => {
		const len = data.length;

		append_size16(job, len);

		for (let i = 0; i < len; i++) {
			job.result[job.caret + i] = data[i];
		}
		job.caret = job.caret + len;
	},

	/**
	 * Reads an object as a binary
	 * @param {array} data The data to append
	 */
	schema_array: (job, data, key) => {
		const schema = job.schema[key].items;
		const len = data.length;
		let curr = job.caret;
		let diff = 0;

		// Reserve the counting bytes
		job.result[job.caret] = 0;
		job.result[job.caret + 1] = 0;
		job.caret = job.caret + 2;
		for (let i = 0; i < len; i++) {
			if (data[i] !== undefined && data[i] !== null) {
				transforms.schema(job, data[i], key);
			}
		}

		diff = job.caret - curr - 2;
		job.result[curr] = (diff >>> 8);
		job.result[curr + 1] = (diff & 0xff);
	},

	/**
	 * Reads a boolean as a binary
	 * @param {boolean} data The data to append
	 */
	boolean: (job, data) => {
		job.result[job.caret] = 1;
		job.result[job.caret + 1] = data ? 1 : 0;
		job.caret = job.caret + 2;
	},

	/**
	 * Reads an int8 number as a binary
	 * @param {boolean} data The data to append
	 */
	int8: (job, data) => {
		if (data < 0) data = 0xff + data + 1;
		job.result[job.caret] = 1;
		job.result[job.caret + 1] = (data & 0xff);
		job.caret = job.caret + 2;
	},

	/**
	 * Reads an int16 number as a binary
	 * @param {boolean} data The data to append
	 */
	int16: (job, data) => {
		job.result[job.caret] = 2;
		job.result[job.caret + 1] = (data >>> 8);
		job.result[job.caret + 2] = (data & 0xff);
		job.caret = job.caret + 3;
	},

	/**
	 * Reads an int32 number as a binary
	 * @param {boolean} data The data to append
	 */
	int32: (job, data) => {
		if (data < 0) data = 0xffffffff + data + 1;

		job.result[job.caret] = 4;
		job.result[job.caret + 1] = (data >>> 24);
		job.result[job.caret + 2] = (data >>> 16);
		job.result[job.caret + 3] = (data >>> 8);
		job.result[job.caret + 4] = (data & 0xff);
		job.caret = job.caret + 5;
	},

	/**
	 * Reads a double number as a binary
	 * @param {boolean} data The data to append
	 * @returns {array} The binary representation
	 */
	double: (job, data) => {
		job.result[job.caret] = 8;
		ieee754.write(job.result, data, job.caret + 1, false, 52, 8);
		job.caret = job.caret + 9;
	},

	/**
	 * Reads a string as a binary
	 * @param {boolean} data The data to append
	 * @returns {array} The binary representation
	 */
	string: (job, data) => {
		data = '' + data;

		let len = data.length;

		job.result[job.caret] = len;
		for (let i = 0; i < len; i++) {
			job.result[job.caret + 1 + i] = data.charCodeAt(i);
		}
		job.caret = job.caret + len + 1;
	}
}

/* Exports -------------------------------------------------------------------*/

module.exports = encode;