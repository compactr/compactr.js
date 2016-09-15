/**
 * Decoding function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const ieee754 = require('ieee754');

const Types = require('./Types');

/* Local variables -----------------------------------------------------------*/

const READ_SKIP = 2;

const INT8_SIZE = 1;
const INT16_SIZE = 2;
const INT32_SIZE = 4;
const DOUBLE_SIZE = 8;

const SEP_CODE = 255;
const SCHEMA_SEP_CODE = 254;
const ARRAY_SEP_CODE = 253;

const ZERO = 0;
const ONE = 1;

const CPR = Object.create(null);

/* Methods -------------------------------------------------------------------*/

/**
 * Decodes a Compactr Buffer using a Schema
 * @param {object} schema The Schema to use to decode the buffer
 * @param {Buffer} data The buffer to decode
 * @param {boolean} nested Wether the decode is for a nested Schema
 * @returns {object} The decoded buffer
 */
function Decode(schema, data, nested) {
	schema = schema.attributes || schema;	// Waterline Model
	const keys = Object.keys(schema);
	const len = data.length;

	let result = {};
	let _caret = len;
	let prev = null;

	let hold = [];
	let in_schema = false;

	for (let i = len - ONE; i >= ZERO; i--) {
		let curr = data[i];
		if (curr === SEP_CODE && in_schema === false) {
			let _propName = keys[prev];
			let sub_schema;
			if (_propName !== undefined && schema[_propName] !== undefined) {
				let _propType = Types.resolve(schema[_propName]);
				if (
					_propType === Types.SCHEMA_ARRAY || 
					_propType === Types.SCHEMA
				) {
					sub_schema = Types.get_schema(schema[_propName]);
				}

				result[_propName] = read(
					data, 
					_propType, 
					i + READ_SKIP, 
					_caret, 
					sub_schema
				);

				if (i === ZERO) break;

				_caret = i;
				prev = data[i];
			}
		}
		else if (curr === SCHEMA_SEP_CODE) {
			if (in_schema === false) {
				if (
					prev === SEP_CODE || 
					prev === null || 
					prev === SCHEMA_SEP_CODE
				) {
					in_schema = true;
				}
			}
			else {
				if (data[i - 2] === SEP_CODE && prev === SEP_CODE) {
					in_schema = false;
				}
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
	/*if (!(buffer[from] & 0x80)) return (buffer[from]);
	return ((0xff - buffer[from] + 1) * -1);*/
	return buffer[from];
}

/**
 * Returns a signed INT16 value - 2 bytes - (-32768<->32767)
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {integer} The INT16 value
 */
function read_int16(buffer, from, to) {
	let val = buffer[from + 1] | (buffer[from] << 8);
	return (val & 0x8000) ? val | 0xFFFF0000 : val;
}

/**
 * Returns a signed INT32 value - 4 bytes - (...)
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {integer} The INT32 value
 */
function read_int32(buffer, from, to) {
	return (buffer[from] << 24) |
		(buffer[from + 1] << 16) |
		(buffer[from + 2] << 8) |
		(buffer[from + 3]);
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
		res.push(buffer[i] === ONE);
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
	return ieee754.read(buffer, from, false, 52, 8)
}

/**
 * Returns an object value
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {object} The Schema value
 */
function read_schema(buffer, from, to, schema) {
	let bytes = [];
	for (let i = from + ONE; i < to - ONE; i++) {
		bytes[bytes.length] = buffer[i];
	}

	return Decode(schema, bytes, true);
}

/**
 * Returns an object array value
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {array} The Schema array value
 */
function read_schema_array(buffer, from, to, schema) {
	let caret = from;
	let res = [];
	for (let i = caret + ONE; i < to; i++) {
		if (buffer[i] === SCHEMA_SEP_CODE) {
			res[res.length] = read_schema(buffer, caret, i + ONE, schema);
			caret = i;
			i++;
		}
	}

	return res;
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
 * @param {object|null} schema The sub schema to use
 * @returns {?} The decoded value
 */
function read(buffer, type, from, to, schema) {
	if (type === Types.BOOLEAN) return read_boolean(buffer, from);
	else if (type === Types.NUMBER) return read_number(buffer, from, to);
	else if (type === Types.STRING)	return read_string(buffer, from, to);
	else if (type === Types.BOOLEAN_ARRAY) {
		return read_boolean_array(buffer, from, to);
	}
	else if (type === Types.NUMBER_ARRAY) {
		return read_number_array(buffer, from, to);
	}
	else if (type === Types.STRING_ARRAY) {
		return read_string_array(buffer, from, to);
	}
	else if (type === Types.SCHEMA_ARRAY) {
		return read_schema_array(buffer, from, to, schema);
	}
	else if (type === Types.SCHEMA) {
		return read_schema(buffer, from, to, schema);
	}
}

/* Exports -------------------------------------------------------------------*/

module.exports = Decode;