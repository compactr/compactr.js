/** Schema parsing component */

/* Requires ------------------------------------------------------------------*/

const Encoder = require('./encoder');
const Decoder = require('./decoder');
const Reader = require('./reader');
const Writer = require('./writer');
const Converter = require('./converter');

/* Methods -------------------------------------------------------------------*/

/**
 * Creates a new schema definition, with a reader and writer attached
 * @param {*} schema The schema to use
 * @param {Object (keyOrder: {boolean})} options The options for the schema
 */
function Schema(schema, options = { keyOrder: false }) {
  const sizeRef = {
    boolean: 1,
    number: 8,
    int8: 1,
    int16: 2,
    int32: 4,
    double: 8,
    string: 2,
    char8: 1,
    char16: 2,
    char32: 4,
    array: 2,
    object: 1,
    unsigned: 8,
    unsigned8: 1,
    unsigned16: 2,
    unsigned32: 4,
  };

  const defaultSizes = {
    boolean: 1,
    number: 8,
    int8: 1,
    int16: 2,
    int32: 4,
    double: 8,
    unsigned: 8,
    unsigned8: 1,
    unsigned16: 2,
    unsigned32: 4,
  };

  const scope = {
    schema,
    indices: {},
    items: Object.keys(schema),
    headerBytes: [0],
    contentBytes: [0],
    header: [],
    contentBegins: 0,
    options,
  };
  scope.indices = preformat(schema);
  const writer = Writer(scope);
  const reader = Reader(scope);

  applyBlank(); // Pre-load header for easy streaming

  /** @private */
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
          type: keyType,
          transformIn: (childSchema !== undefined) ? Encoder[keyType].bind(null, childSchema) : Encoder[keyType],
          transformOut: (childSchema !== undefined) ? Decoder[keyType].bind(null, childSchema) : Decoder[keyType],
          coerse: Converter[keyType],
          getSize: Encoder.getSize.bind(null, count),
          fixedSize: defaultSizes[keyType] && Encoder.getSize(count, defaultSizes[keyType]) || null,
          size: schema[key].size || defaultSizes[keyType] || null,
          count,
          nested: childSchema,
        };
      });

    return ret;
  }

  /** @private */
  function applyBlank() {
    for (let key in scope.schema) {
      scope.header.push({
        key: scope.indices[key],
        size: scope.indices[key].size || sizeRef[scope.indices[key].type],
      });
    }
  }

  /** @private */
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

  return Object.assign({}, writer, reader);
}

/* Exports -------------------------------------------------------------------*/

module.exports = Schema;