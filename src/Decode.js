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

let doubleBuffer = Buffer.alloc(8);

/* Methods -------------------------------------------------------------------*/

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

function read_index(buffer, index) {
	return buffer[index + 1];
}

function read_boolean(buffer, index) {
	return buffer[index] === 1;
}

function read_int8(buffer, from, to) {
	return buffer.readInt8(from, to);
}

function read_int16(buffer, from, to) {
	return buffer.readInt16BE(from, to);
}

function read_int32(buffer, from, to) {
	return buffer.readInt32BE(from, to);
}

function read_string(buffer, from, to) {
	return buffer.toString(undefined, from, to);
}

function read_double(buffer, from, to) {
	buffer.copy(
		doubleBuffer, 
		0, 
		from, 
		from + DOUBLE_SIZE
	);
	return doubleBuffer.readDoubleBE();
}

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