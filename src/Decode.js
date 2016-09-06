/**
 * Decoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Types = require('./Types');

/* Local variables -----------------------------------------------------------*/

const SEP_CODE = 255;
const READ_SKIP = 2;

const INT8_SIZE = 1;
const INT16_SIZE = 2;
const INT32_SIZE = 4;
const DOUBLE_SIZE = 8;

const ARRAY_SEP_CODE = 44;

const ZERO = 0;
const ONE = 1;

const CPR = Object.create(null);

/* Methods -------------------------------------------------------------------*/

/**
 * Decodes a Compactr Buffer using a Schema
 * @param {object} schema The Schema to use to decode the buffer
 * @param {Buffer} data The buffer to decode
 * @returns {object} The decoded buffer
 */
function Decode(schema, data) {
	schema = schema.attributes || schema;	// Waterline Model
	const keys = Object.keys(schema);
	const len = data.length;

	let result = {};
	let _caret = len;
	let prev;

	for (let i = len - READ_SKIP; i >= ZERO; i--) {
		let curr = data[i];
		if (curr === SEP_CODE) {
			let _propName = keys[prev];
			if (_propName !== undefined && schema[_propName] !== undefined) {
				let _propType = Types.resolve(schema[_propName]);
				result[_propName] = read(data, _propType, i + READ_SKIP, _caret);
				if (i === ZERO) break;
				_caret = i;
				i -= READ_SKIP;
				prev = data[i];
			}
		}
		else prev = curr;
	}

	return result;
}

/**
 * Returns a Boolean value - 1 byte - (0<->1)
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} index The buffer index to read at
 * @returns {integer} The Boolean value
 */
function read_boolean(buffer, index) {
	return buffer[index] === ONE;
}

/**
 * Returns a signed INT8 value - 1 byte - (-128<->127)
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {integer} The INT8 value
 */
function read_int8(buffer, from, to) {
	return buffer.readInt8(from, to);
}

/**
 * Returns a signed INT16 value - 2 bytes - (-32768<->32767)
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {integer} The INT16 value
 */
function read_int16(buffer, from, to) {
	return buffer.readInt16BE(from, to);
}

/**
 * Returns a signed INT32 value - 4 bytes - (...)
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {integer} The INT32 value
 */
function read_int32(buffer, from, to) {
	return buffer.readInt32BE(from, to);
}

/**
 * Returns a String value
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {integer} The String value
 */
function read_string(buffer, from, to) {
	let acc = [];
	for (let i = from; i < to; i++) {
		acc.push(buffer[i]);
	}
	return String.fromCodePoint.apply(CPR, acc);
}

/**
 * Returns an Array of String values
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {array} The Array value
 */
function read_string_array(buffer, from, to) {
	let acc = [];
	let res = [];
	for (let i = from; i < to; i++) {
		if (buffer[i] !== ARRAY_SEP_CODE) acc.push(buffer[i]);
		else {
			res.push(String.fromCodePoint.apply(CPR, acc));
			acc.length = ZERO;
		}
	}
	res.push(String.fromCodePoint.apply(CPR, acc));
	return res;
}

/**
 * Returns an Array of Boolean values
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {array} The Array value
 */
function read_boolean_array(buffer, from, to) {
	let res = [];
	for (let i = from; i < to; i++) {
		if (buffer[i] !== ARRAY_SEP_CODE) {
			res.push(buffer[i] === ONE);
			i++;
		}
	}
	return res;
}

/**
 * Returns an Array of Number values
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {array} The Array value
 */
function read_number_array(buffer, from, to) {
	let acc = from;
	let res = [];
	for (let i = from + ONE; i < to; i++) {
		if (buffer[i] === ARRAY_SEP_CODE) {
			res.push(read_number(buffer, acc, i));
			acc = i + ONE;
			i++;
		}
	}
	res.push(read_number(buffer, acc, to));
	return res;
}

/**
 * Returns a double value - 8 bytes
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {integer} The double value
 */
function read_double(buffer, from, to) {
	return buffer.readDoubleBE(from, to);
}

/**
 * Returns a number value - 1 to 8 bytes
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {integer} The double value
 */
function read_number(buffer, from, to) {
	let size = to - from;
	if (size === INT8_SIZE) return read_int8(buffer, from, to);
	else if (size === INT16_SIZE) return read_int16(buffer, from, to);
	else if (size === INT32_SIZE) return read_int32(buffer, from, to);
	else if (size === DOUBLE_SIZE) return read_double(buffer, from, to);
}

/**
 * Returns the decoded value for a property
 * @param {integer} type The expected variable type
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {?} The decoded value
 */
function read(buffer, type, from, to) {
	if (type === Types.BOOLEAN) return read_boolean(buffer, from);
	else if (type === Types.NUMBER) return read_number(buffer, from, to);
	else if (type === Types.STRING)	return read_string(buffer, from, to);
	else if (type === Types.BOOLEAN_ARRAY) {
		return read_boolean_array(buffer, from, to);
	}
	else if (type === Types.NUMBER_ARRAY) {
		return read_number_array(buffer, from, to);
	}
	else return read_string_array(buffer, from, to);
}

/* Exports -------------------------------------------------------------------*/

module.exports = Decode;