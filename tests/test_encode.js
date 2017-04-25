/**
 * Encoder
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const options = require('./options');
const transforms = require('./transforms').encode;

/* Methods -------------------------------------------------------------------*/

function get_transforms(indexes) {
	return indexes
		.map(key => transforms[key[0].toString()].bind(key[2]));
}

function get_indexes(schema, payload) {
	return Object.keys(schema)
		.map((key, i) => [key, i, schema[key]])
		.filter((prop) => payload.includes(prop[0]));
}

function get_lengths(indexes, body) {
	return body.map((data, i) => options.capped_size(indexes[i], data));
}

function get_body(indexes, transforms, payload) {
	return indexes.map((index) => transforms[index[1]](payload[index[0]]));
}

function encode(schema, payload) {
	const indexes = get_indexes(schema, payload);
	const transforms = get_transforms(indexes);
	const body = get_body(indexes, transforms, payload);
	const lengths = get_lengths(body);
	let head = [...indexes].map((i, pos, arr) => arr.splice(pos, 0, ...lengths[pos]));
	
	return to_buffer(head, body);
}

function to_buffer(head, body) {
	return Buffer.from([...head,...body]);
}

/* Exports -------------------------------------------------------------------*/

module.exports = encode;