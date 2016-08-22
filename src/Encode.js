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

let work_buffers = [Buffer.allocUnsafe(MAX_SIZE)];

/* Methods -------------------------------------------------------------------*/

function Encode(schema, obj) {
	let result = getBuffer();
	const keys = Object.keys(schema);
	const len = keys.length;
	
	result.caret = 0;

	for (let i = len - 1; i >= 0; i--) {
		let key = keys[i];
		if (key in obj && obj[key] !== null && obj[key] !== undefined) {
			let _type = schema[key].type || schema[key];
			append_index(result, i);
			append(result, Types.resolve(_type), obj[key]);
		}
	}
	 
	releaseBuffer(result);
	return result.slice(0, result.caret);
}

function getBuffer() {
	if (work_buffers.length === 0) return Buffer.allocUnsafe(MAX_SIZE);
	else return work_buffers.shift();
}

function releaseBuffer(buffer) {
	work_buffers.push(buffer);
}

function append(buffer, type, data) {
	if (type === Types.BOOLEAN) append_boolean(buffer, data);
	else if (type === Types.NUMBER) {
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
	else if (type === Types.STRING) append_string(buffer, data);
}

function append_boolean(buffer, data) {
	buffer[buffer.caret] = data ? 1 : 0;
	buffer.caret += INT8_SIZE;
}

function append_int8(buffer, data) {
	buffer.writeInt8(data, buffer.caret);
	buffer.caret += INT8_SIZE;
}

function append_int16(buffer, data) {
	buffer.writeInt16BE(data, buffer.caret);
	buffer.caret += INT16_SIZE;
}

function append_int32(buffer, data) {
	buffer.writeInt32BE(data, buffer.caret);
	buffer.caret += INT32_SIZE;
}

function append_double(buffer, data) {
	// Ommit last 2 digits of the double 
	buffer.writeDoubleBE(data, buffer.caret);
	buffer.caret += DOUBLE_SIZE;
}

function append_string(buffer, data) {
	buffer.write(data, buffer.caret, data.length);
	buffer.caret += data.length;
}

function append_index(buffer, data) {
	buffer[buffer.caret] = SEP_CODE;
	// Unsigned Int
	buffer[buffer.caret + 1] = data;
	buffer.caret += INT16_SIZE;
}

/* Exports -------------------------------------------------------------------*/

module.exports = Encode;