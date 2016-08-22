/**
 * A buffer work station
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

// Re-use of same buffer to read full doubles
let doubleBuffer = Buffer.alloc(8);
let workBuffer = Buffer.allocUnsafe(MAX_SIZE);


/* Methods -------------------------------------------------------------------*/

class Workbench {
	constructor(buffer) {
		this.buffer = buffer || workBuffer;
		this.caret = 0;
	}

	_append_boolean(data) {
		this.buffer[this.caret] = data ? 1 : 0;
		this.caret += INT8_SIZE;
	}

	_append_int8(data) {
		this.buffer.writeInt8(data, this.caret);
		this.caret += INT8_SIZE;
	}

	_append_int16(data) {
		this.buffer.writeInt16BE(data, this.caret);
		this.caret += INT16_SIZE;
	}

	_append_int32(data) {
		this.buffer.writeInt32BE(data, this.caret);
		this.caret += INT32_SIZE;
	}

	_append_double(data) {
		// Ommit last 2 digits of the double 
		this.buffer.writeDoubleBE(data, this.caret);
		this.caret += DOUBLE_SIZE;
	}

	_append_string(data) {
		this.buffer.write(data, this.caret, data.length);
		this.caret += data.length;
	}

	_append_buffer(data) {
		data.copy(this.buffer, this.caret, 0, data.length);
		this.caret += data.length;
	}

	_append_index(data) {
		// Unsigned Int
		this.buffer[this.caret] = data;
		this.caret += INT8_SIZE;
	}

	_append_sep() {
		this.buffer[this.caret] = Workbench.SEP_CODE;
		this.caret += INT8_SIZE;
	}

	append(type, data) {
		if (type === Types.BOOLEAN) this._append_boolean(data);
		else if (type === Types.NUMBER) {
			if (Number.isInteger(data)) {
				if (data <= MAX_INT8 && data >= MIN_INT8) {
					this._append_int8(data);
				}
				else if (data <= MAX_INT16 && data >= MIN_INT16) {
					this._append_int16(data);
				}
				else this._append_int32(data);
			}
			else this._append_double(data);
		}
		else if (type === Types.STRING) this._append_string(data);
		else if (type === Types.INDEX) this._append_index(data);		
		else if (type === Types.BUFFER) this._append_buffer(data);
		else if (type === Types.SEP) this._append_sep();
	}

	read(type, from, to) {
		if (type === Types.BOOLEAN) return this.buffer[from] === 1;
		else if (type === Types.NUMBER) {
			if (to - from === INT8_SIZE) {
				return this.buffer.readInt8(from, to);
			}
			else if (to - from === INT16_SIZE) {
				return this.buffer.readInt16BE(from, to);
			}
			else if (to - from === INT32_SIZE) {
				return this.buffer.readInt32BE(from, to);
			}
			else {
				this.buffer.copy(
					doubleBuffer, 
					0, 
					from, 
					from + DOUBLE_SIZE
				);
				return doubleBuffer.readDoubleBE();
				//return this.buffer.readDoubleBE(from, to);
			}
		}
		else if (type === Types.STRING)	return this.buffer.toString(undefined, from, to);
		else if (type === Types.BUFFER) return this.buffer.slice(from, to);
		else if (type === Types.INDEX) return this.buffer[from];
	}
}

Workbench.SEP_CODE = 255;

/* Exports -------------------------------------------------------------------*/

module.exports = Workbench;