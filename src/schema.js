/** Schema parsing component */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Encoder = require('./encoder');
const Decoder = require('./decoder');
const Reader = require('./reader');
const Writer = require('./writer');
const Converter = require('./converter');

/* Methods -------------------------------------------------------------------*/

function Schema(schema) {
  
  const scope = {
    schema,
    indices: {},
    items: Object.keys(schema),
    headerBytes: [],
    contentBytes: [],
    header: [],
    contentBegins: 0
  };

  scope.indices = preformat(schema);

  function preformat(schema) {
    const ret = {};
    Object.keys(schema)
      .sort()
      .forEach((key, index) => {
        const keyType = schema[key].type;
        const count = schema[key].count || 1;
        const childSchema = computeNested(schema, key, keyType);

        ret[key] = {
          name: key,
          index,
          transformIn: (childSchema !== undefined) ? Encoder[keyType].bind(null, childSchema) : Encoder[keyType],
          transformOut: (childSchema !== undefined) ? Decoder[keyType].bind(null, childSchema) : Decoder[keyType],
          coerse: Converter[keyType],
          getSize: Encoder.getSize.bind(null, count),
          size: schema[key].size || null,
          count
        };
      });

    return ret;
  }

  function computeNested(schema, key) {
    const keyType = schema[key].type;
    const isObject = (keyType === 'object');
    const isArray = (keyType === 'array');
    let childSchema;

    if (isObject === true || isArray === true) {
      if (isObject === true) childSchema = Schema(schema[key].schema);
      if (isArray === true) {
        const itemChildSchema = computeNested(schema[key], 'items');

        childSchema = {
          count: schema[key].items.count || 1,
          getSize: Encoder.getSize.bind(null, schema[key].items.count || 1),
          transformIn: (itemChildSchema !== undefined) ? Encoder[schema[key].items.type].bind(null, itemChildSchema) : Encoder[schema[key].items.type],
          transformOut: (itemChildSchema !== undefined) ? Decoder[schema[key].items.type].bind(null, itemChildSchema) : Decoder[schema[key].items.type],
        };
      }
    }
    
    return childSchema;
  }

  return Object.assign({}, Writer(scope), Reader(scope));
}

/* Exports -------------------------------------------------------------------*/

module.exports = Schema;