/**
 * Protocol defaults
 *
 * !Some principal data types are not overridable!
 */

'use strict';

/* Local variables -----------------------------------------------------------*/

const INT8 = 1;
const INT16 = 2;
const INT32 = 4;

/* Exports -------------------------------------------------------------------*/

module.exports = {
	
	boolean: Object.freeze({
		length_bytes: 0
	}),

	boolean_array: {
		length_bytes: INT8
	},

	int8: Object.freeze({
		length_bytes: INT8
	}),

	int8_array: {
		length_bytes: INT8
	},

	int16: Object.freeze({
		length_bytes: INT8
	}),

	int16_array: {
		length_bytes: INT8
	},

	int32: Object.freeze({
		length_bytes: INT8
	}),

	int32_array: {
		length_bytes: INT8
	},

	double: Object.freeze({
		length_bytes: INT8
	}),

	double_array: {
		length_bytes: INT16
	},

	number: Object.freeze({
		length_bytes: INT8
	}),

	number_array: {
		length_bytes: INT16
	},

	string: {
		length_bytes: INT8
	},

	string_array: {
		length_bytes: INT16
	},

	schema: {
		length_bytes: INT16
	},

	schema_array: {
		length_bytes: INT32
	}
};