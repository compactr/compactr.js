/**
 * Payload validation function
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Types = require('./Types');

/* Methods -------------------------------------------------------------------*/

function validate(schema, payload) {
	let keys = Object.keys(schema);
	schema = schema.attributes || schema;
	
	const len = keys.length;

	let warnings = [];

	for (let i = 0; i < len; i++) {
		let key = keys[i];

		// Ignore nulls and undefineds, they are skipped anyways
		if (payload[key] !== undefined && payload[key] !== null) {
			is_valid(
				warnings, 
				key, 
				Types.resolve(schema[key]), 
				payload[key]
			);
		}
	}

	return warnings;
}

function is_valid(warnings, key, type, value) {
	if (type === Types.BOOLEAN) {
		if (value !== true && value !== false) {
			warnings.push(key + ': "' + value + '" is not a boolean');
		}
	}
	if (type === Types.STRING) {
		if (value !== '' + value) {
			warnings.push(key + ': "' + value + '" is not a string');
		}
	}
	if (type === Types.NUMBER) {
		if (value !== Number(value)) {
			warnings.push(key + ': "' + value + '" is not a string');
		}
	}
}

/* Exports -------------------------------------------------------------------*/

module.exports = validate;