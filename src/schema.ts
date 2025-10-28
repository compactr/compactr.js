/** Schema parsing component */

/* Requires ------------------------------------------------------------------ */

import Encoder from './encoder';
import Decoder from './decoder';
import Reader from './reader';
import Writer from './writer';
import Converter from './converter';

/* Methods ------------------------------------------------------------------- */

/**
 * Resolves the internal type based on OpenAPI type and format
 * @private
 */
function resolveType(type, format) {
  if (type === 'integer') {
    const fmt = format || 'int32';
    return fmt === 'int64' ? 'int64' : 'int32';
  }

  if (type === 'number') {
    const fmt = format || 'double';
    return fmt === 'float' ? 'float' : 'double';
  }

  return type;
}

export default function Schema(schema, options = { keyOrder: false }) {
  const sizeRef = {
    boolean: 1,
    int32: 4,
    int64: 8,
    float: 4,
    double: 8,
    string: 2,
    array: 2,
    object: 1,
  };

  const defaultSizes = {
    boolean: 1,
    int32: 4,
    int64: 8,
    float: 4,
    double: 8,
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
        const fieldType = schema[key].type;
        const fieldFormat = schema[key].format;
        const internalType = resolveType(fieldType, fieldFormat);
        const count = schema[key].count || 1;
        const childSchema = computeNested(schema, key);

        ret[key] = {
          name: key,
          index,
          type: internalType,
          nullable: schema[key].nullable || false,
          transformIn: (childSchema !== undefined) ? Encoder[internalType].bind(null, childSchema) : Encoder[internalType],
          transformOut: (childSchema !== undefined) ? Decoder[internalType].bind(null, childSchema) : Decoder[internalType],
          coerse: Converter[internalType],
          getSize: Encoder.getSize.bind(null, count),
          fixedSize: (defaultSizes[internalType] && Encoder.getSize(count, defaultSizes[internalType])) || null,
          size: schema[key].size || defaultSizes[internalType] || null,
          count,
          nested: childSchema,
        };
      });

    return ret;
  }

  /** @private */
  function applyBlank() {
    for (const key in scope.schema) {
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
      if (isObject === true) childSchema = Schema(schema[key].schema, options);
      if (isArray === true) {
        const itemChildSchema = computeNested(schema[key], 'items');
        const itemType = schema[key].items.type;
        const itemFormat = schema[key].items.format;
        const internalItemType = resolveType(itemType, itemFormat);

        childSchema = {
          count: schema[key].items.count || 1,
          getSize: Encoder.getSize.bind(null, schema[key].items.count || 1),
          transformIn: (itemChildSchema !== undefined) ? Encoder[internalItemType].bind(null, itemChildSchema) : Encoder[internalItemType],
          transformOut: (itemChildSchema !== undefined) ? Decoder[internalItemType].bind(null, itemChildSchema) : Decoder[internalItemType],
        };
      }
    }

    return childSchema;
  }

  return Object.assign({}, writer, reader);
}
