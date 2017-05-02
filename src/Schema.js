/** Schema parsing component */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Encoder = require('./Encoder');
const Decoder = require('./Decoder');
const Reader = require('./Reader');
const Writer = require('./Writer');
const Validator = require('./Validator');

/* Local variables -----------------------------------------------------------*/

const types = {
	boolean: 1,
	number: 1,
	int8: 1,
	int16: 1,
	int32: 1,
	double: 1,
	string: 1,
	char8: 1,
	char16: 1,
	char32: 1,
	array: 2,
	schema: 2
};

/* Methods -------------------------------------------------------------------*/

function Schema(schema) {
	
	const scope = {
		schema,
		indices: null,
		items: Object.keys(schema),
		bytes: [],
		map: [],
		data: []
	};

	const encoder = Encoder(scope, Schema);
	const decoder = Decoder(scope, Schema);

	scope.indices = preformat(schema);

	function preformat(schema) {
		const ret = {};
		Object.keys(schema)
			.forEach((key, index) => {
				const count = schema[key].count || types[schema[key].type];
				ret[key] = {
					name: key,
					index,
					transformIn: encoder[schema[key].type],
					transformOut: decoder[schema[key].type],
					getSize: encoder.getSize.bind(null, count),
					size: schema[key].size || null,
					count
				};
			});

		return ret;
	}

	return Object.assign({}, Writer(scope), Reader(scope), Validator(scope));
}

/* Exports -------------------------------------------------------------------*/

module.exports = Schema;