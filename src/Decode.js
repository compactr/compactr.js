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
const DOUBLE_SIZE = 6;

const CPR = Object.create(null);

let doubleBuffer = Buffer.alloc(8);

/* Methods -------------------------------------------------------------------*/

/**
 * Decodes a Compactr Buffer using a Schema
 * @param {object} schema The Schema to use to decode the buffer
 * @param {Buffer} data The buffer to decode
 * @returns {object} The decoded buffer
 */
function Decode(schema, data) {
	let result = {};
	const keys = Object.keys(schema);
	const len = data.length;
	
	let _caret = len;

	for (let i = len - 1; i >= 0; i--) {
		if (data[i] === SEP_CODE) {
			let _propName = keys[read_index(data, i)];
			if (_propName !== undefined && schema[_propName] !== undefined) {
				let _propType = Types.resolve(schema[_propName].type || schema[_propName]);
				result[_propName] = read(data, _propType, i + READ_SKIP, _caret);
				if (i === 0) break;
				_caret = i;
				i -= READ_SKIP;
			}
		}		
	}

	return result;
}

/**
 * Returns a Schema key index - 1 byte - (0<->255)
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} index The buffer index to read at
 * @returns {integer} The Schema index key
 */
function read_index(buffer, index) {
	return buffer[index + 1];
}

/**
 * Returns a Boolean value - 1 byte - (0<->1)
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} index The buffer index to read at
 * @returns {integer} The Boolean value
 */
function read_boolean(buffer, index) {
	return buffer[index] === 1;
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
 * Returns a double value - 6 bytes
 * !Doubles are in fact 8 bytes long, but only the first 6 are encoded!
 * @param {Buffer} buffer The buffer to read from
 * @param {integer} from The buffer index to read from
 * @param {integer} to The buffer index to read to
 * @returns {integer} The double value
 */
function read_double(buffer, from, to) {
	buffer.copy(
		doubleBuffer, 
		0, 
		from, 
		from + DOUBLE_SIZE
	);
	return doubleBuffer.readDoubleBE();
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
	let res;

	if (type === Types.BOOLEAN) res = read_boolean(buffer, from);
	else if (type === Types.NUMBER) {
		if (to - from === INT8_SIZE) res = read_int8(buffer, from, to);
		else if (to - from === INT16_SIZE) res = read_int16(buffer, from, to);
		else if (to - from === INT32_SIZE) res = read_int32(buffer, from, to);
		else res = read_double(buffer, from, to);
	}
	else if (type === Types.STRING)	res = read_string(buffer, from, to);
		
	return res;
}

/* Exports -------------------------------------------------------------------*/

module.exports = Decode;