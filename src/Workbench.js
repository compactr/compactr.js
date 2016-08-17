/**
 * A buffer work station
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Types = require('./Types');

/* Local variables -----------------------------------------------------------*/

// One frame - all overheads
const MAX_SIZE = 1400;

// Re-use of same buffer to read full doubles
let doubleBuffer = Buffer.alloc(8);

/* Methods -------------------------------------------------------------------*/

class Workbench {
	constructor(buffer, trim) {
		this.buffer = buffer || Buffer.allocUnsafe(MAX_SIZE);
		this._caret = 0;

		this.DOUBLE_TRIM = trim || 6;
	}

	append(type, data) {
		switch(type) {
			case Types.ARRAY:
				throw new Error('Not implemented yet');
			case Types.BOOLEAN:
				this.buffer[this._caret] = data ? 1 : 0;
				this._caret += 1;
				break;
			case Types.NUMBER:
				// Check if Double or int8
				// Reserving 255 for SEP
				if (Number.isInteger(data) && data < 255 && data >= 0) {
					this.buffer.writeInt8(data, this._caret);
					this._caret += 1;
				}
				else {
					// Ommit last 2 digits of the double 
					this.buffer.writeDoubleBE(data, this._caret);
					this._caret += this.DOUBLE_TRIM;
				}
				break;
			case Types.STRING:
				this.buffer.write(data, this._caret, data.length);
				this._caret += data.length;
				break;
			case Types.BUFFER:
				data.copy(this.buffer, this._caret, 0, data.length);
				this._caret += data.length;
				break;
			case Types.SEP:
				this.buffer[this._caret] = Workbench.SEP_CODE;
				this._caret += 1;
				break;
		}
	}

	read(type, from=0, to=null) {
		to = to || this._caret;

		switch(type) {
			case Types.ARRAY:
				throw new Error('Not implemented yet');
			case Types.BOOLEAN:
				return this.buffer[from] === 1;
			case Types.NUMBER:
				if (to - from === 1) return this.buffer.readInt8(from, to);
				else {
					this.buffer.copy(
						doubleBuffer, 
						0, 
						from, 
						from + this.DOUBLE_TRIM
					);
					return doubleBuffer.readDoubleBE();
				}
			case Types.STRING:
				return this.buffer.toString(undefined, from, to);
			case Types.BUFFER:
				return this.buffer.slice(from, to);
		}
	}
}

Workbench.SEP_CODE = 255;

/* Exports -------------------------------------------------------------------*/

module.exports = Workbench;