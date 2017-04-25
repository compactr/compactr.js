/**
 * Decoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const ieee754 = require('ieee754');

/* Local variables -----------------------------------------------------------*/

const CPR = Object.create(null);

/* Methods -------------------------------------------------------------------*/

/**
 * Decodes a Compactr Buffer using a Schema
 * @param {object} schema The Schema to use to decode the buffer
 * @param {Buffer} data The buffer to decode
 * @returns {object} The decoded buffer
 */
function decode(schema, data) {
	const job = {
		keys: Object.keys(schema),
		transforms: Object.keys(schema).map((key) => schema[key].type || schema[key]),
		result: {},
		caret: 0,
		schema: schema
	};

	const len = data.length;

	while (job.caret < len) {
		let key = job.keys[data[job.caret]];
		let transform = job.transforms[data[job.caret]];

		console.log('decode',transform);
		transforms[transform](job, data, key);
	}

	return job.result;
}


function size16(first, next) {
	return (first << 8) | next;
}

const length_byte_size = {
	binary: 2
	boolean: 0,
	boolean_array: 1,
	int8:1,
	int16:1,
	int32:1,
	double:1,
	number:1,
	number_array:2,
	string:1,
	string_array:2,
	schema:2,
	schema_array: 2
};

const transforms = {
	/**
	 * Returns a Boolean value - 1 byte - (0<->1)
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} index The buffer index to read at
	 * @returns {integer} The Boolean value
	 */
	boolean: (job, buffer, key) => {
		job.caret += 1;
		job.result[key] = buffer[job.caret] === 1;
		job.caret += 1; 
	},

	/**
	 * Returns a signed INT8 value - 1 byte - (-128<->127)
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {integer} The INT8 value
	 */
	int8: (job, buffer, key) => {
		job.caret += 2;
		job.result[key] = (!(buffer[job.caret] & 0x80))?buffer[job.caret]:((0xff - buffer[job.caret] + 1) * -1);
		job.caret += 1;
	},

	/**
	 * Returns a signed INT16 value - 2 bytes - (-32768<->32767)
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {integer} The INT16 value
	 */
	int16: (job, buffer, key) => {
		job.caret += 2;
		let val = buffer[from + 1] | (buffer[from] << 8);
		job.result[key] = (val & 0x8000) ? val | 0xFFFF0000 : val;
		job.caret += 2;
	},

	/**
	 * Returns a signed INT32 value - 4 bytes - (...)
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {integer} The INT32 value
	 */
	int32: (job, buffer, key) => {
		job.caret += 2;
		job.result[key] = (buffer[from] << 24) |
			(buffer[from + 1] << 16) |
			(buffer[from + 2] << 8) |
			(buffer[from + 3]);
		job.caret += 4;
	},

	/**
	 * Returns a String value
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {string} The String value
	 */
	string: (job, buffer, key) => {
		job.caret += 1;
		let to = size16(buffer[job.caret], buffer[job.caret + 1]);
		let res = [];
		job.caret += 2;
		for (let i = job.caret; i < to; i++) {
			if (buffer[i] !== null && buffer[i] !== undefined) {
				res.push(buffer[i]);
			}
		}
		job.result[key] = String.fromCharCode.apply(CPR, res);
		job.caret += to;
	},

	/**
	 * Returns a Buffer value
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {Buffer} The buffer value
	 */
	binary: (buffer, from, to) => {
		let res = [];
		for (let i = from; i < to; i++) {
			if (buffer[i] !== null && buffer[i] !== undefined) {
				res.push(buffer[i]);
			}
		}
		return Buffer.from(res);
	},

	/**
	 * Returns an Array of String values
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {array} The Array value
	 */
	string_array: (buffer, from, to) => {
		let acc = [];
		let res = [];
		let check = buffer[from] + from;
		// Read size16
		for (let i = from + 1; i < to; i++) {
			if (i === check + 1) {
				res.push(String.fromCharCode.apply(CPR, acc));
				acc.length = 0;
				check = buffer[i] + i;
			}
			else {
				acc.push(buffer[i]);
			}
		}
		res.push(String.fromCharCode.apply(CPR, acc));

		return res;
	},

	/**
	 * Returns an Array of Boolean values
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {array} The Array value
	 */
	boolean_array: (buffer, from, to) => {
		let res = [];
		for (let i = from; i < to; i++) {
			res.push(buffer[i] === 1);
		}
		return res;
	},

	/**
	 * Returns an Array of Number values
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {array} The Array value
	 */
	number_array: (buffer, from, to) => {
		let res = [];

		// Read size16
		for (let i = from; i < to; i++) {
			let size = buffer[i];
			res.push(transforms.number(buffer, i + 1, i + size + 1));
			i = i + size;
		}
		return res;
	},

	/**
	 * Returns a double value - 8 bytes
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {integer} The double value
	 */
	double: (job, buffer, key) => {
		job.caret += 2;
		job.result[key] = ieee754.read(buffer, job.caret, false, 52, 8)
		job.caret += 8;
	},

	/**
	 * Returns an object value
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {object} The Schema value
	 */
	schema: (buffer, from, to, schema) => {
		let bytes = [];

		// Read size16
		for (let i = from; i < to; i++) {
			bytes[bytes.length] = buffer[i];
		}

		return decode(schema, bytes, true);
	},

	/**
	 * Returns an object array value
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {array} The Schema array value
	 */
	schema_array: (buffer, from, to, schema) => {
		let res = [];

		// Read size16
		for (let i = from; i < to; i++) {
			let size = size16(buffer[i], buffer[i + 1]);
			res.push(transforms.schema(buffer, i + 2, i + size + 2, schema));
			i = i + size + 1;
		}

		return res;
	},

	/**
	 * Returns a number value - 1 to 8 bytes
	 * @param {Buffer} buffer The buffer to read from
	 * @param {integer} from The buffer index to read from
	 * @param {integer} to The buffer index to read to
	 * @returns {integer} The double value
	 */
	number: (job, buffer, key) => {
		let size = to - from;
		if (size === 1) return transforms.int8(buffer, from, to);
		else if (size === 2) return transforms.int16(buffer, from, to);
		else if (size === 4) return transforms.int32(buffer, from, to);
		else if (size === 8) return transforms.double(buffer, from, to);
	}
}


/* Exports -------------------------------------------------------------------*/

module.exports = decode;