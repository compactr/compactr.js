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
	string: 2,
	char8: 2,
	char16: 2,
	char32: 2,
	array: 2,
	schema: 2
};

/* Methods -------------------------------------------------------------------*/

function Schema(schema) {
	
	const scope = {
		schema,
		indices: null,
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
				ret[key] = {
					name: key,
					index,
					transformIn: encoder[schema[key].type],
					transformOut: decoder[schema[key].type],
					size: schema[key].size || null,
					count: schema[key].count || types[schema[key].type]
				};
			});

		return ret;
	}

	return Object.assign({}, Writer(scope), Reader(scope), Validator(scope));
}

/* Exports -------------------------------------------------------------------*/

module.exports = Schema;