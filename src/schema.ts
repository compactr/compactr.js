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

  if (type === 'string') {
    if (format === 'uuid') return 'uuid';
    if (format === 'ipv4') return 'ipv4';
    if (format === 'ipv6') return 'ipv6';
    if (format === 'date') return 'date';
    if (format === 'date-time') return 'date-time';
    if (format === 'binary') return 'binary';
  }

  return type;
}

export default function Schema(schema, options = { keyOrder: false }) {
  const sizeRef = {
    'boolean': 1,
    'int32': 4,
    'int64': 8,
    'float': 4,
    'double': 8,
    'string': 2,
    'uuid': 1,
    'ipv4': 1,
    'ipv6': 1,
    'date': 1,
    'date-time': 1,
    'binary': 4,
    'array': 2,
    'object': 1,
  };

  const defaultSizes = {
    'boolean': 1,
    'int32': 4,
    'int64': 8,
    'float': 4,
    'double': 8,
    'uuid': 16,
    'ipv4': 4,
    'ipv6': 16,
    'date': 4,
    'date-time': 8,
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
        // Handle oneOf/anyOf fields
        if (schema[key].oneOf || schema[key].anyOf) {
          const variantDefs = schema[key].oneOf || schema[key].anyOf;
          const variants = variantDefs.map((variantDef) => {
            const variantType = variantDef.type;
            const variantFormat = variantDef.format;
            const variantInternalType = resolveType(variantType, variantFormat);
            // Binary fields need 4-byte counter by default to support large data
            const variantCount = variantDef.count || (variantInternalType === 'binary' ? 4 : 1);
            const variantChildSchema = computeNestedVariant(variantDef);

            return {
              type: variantInternalType,
              transformIn: (variantChildSchema !== undefined)
                ? Encoder[variantInternalType].bind(null, variantChildSchema)
                : Encoder[variantInternalType],
              transformOut: (variantChildSchema !== undefined)
                ? Decoder[variantInternalType].bind(null, variantChildSchema)
                : Decoder[variantInternalType],
              coerse: Converter[variantInternalType],
              getSize: Encoder.getSize.bind(null, variantCount),
              fixedSize: (defaultSizes[variantInternalType] && Encoder.getSize(variantCount, defaultSizes[variantInternalType])) || null,
              size: variantDef.size || defaultSizes[variantInternalType] || null,
              count: variantCount,
              nested: variantChildSchema,
            };
          });

          ret[key] = {
            name: key,
            index,
            nullable: schema[key].nullable || false,
            variants,
          };
          return;
        }

        // Handle regular fields
        const fieldType = schema[key].type;
        const fieldFormat = schema[key].format;
        const internalType = resolveType(fieldType, fieldFormat);
        // Binary fields need 4-byte counter by default to support large data
        const count = schema[key].count || (internalType === 'binary' ? 4 : 1);
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
      // Skip variant fields in applyBlank as their size depends on runtime variant
      if (scope.indices[key].variants) {
        continue;
      }
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
        childSchema = processArrayItems(schema[key].items);
      }
    }

    return childSchema;
  }

  /** @private */
  function processArrayItems(itemDef) {
    // Handle oneOf/anyOf in array items
    if (itemDef.oneOf || itemDef.anyOf) {
      const variantDefs = itemDef.oneOf || itemDef.anyOf;
      const variants = variantDefs.map((variantDef) => {
        const variantType = variantDef.type;
        const variantFormat = variantDef.format;
        const variantInternalType = resolveType(variantType, variantFormat);
        const variantCount = variantDef.count || (variantInternalType === 'binary' ? 4 : 1);
        const variantChildSchema = processArrayItemsNested(variantDef);

        return {
          type: variantInternalType,
          transformIn: (variantChildSchema !== undefined)
            ? Encoder[variantInternalType].bind(null, variantChildSchema)
            : Encoder[variantInternalType],
          transformOut: (variantChildSchema !== undefined)
            ? Decoder[variantInternalType].bind(null, variantChildSchema)
            : Decoder[variantInternalType],
          coerse: Converter[variantInternalType],
          getSize: Encoder.getSize.bind(null, variantCount),
          fixedSize: (defaultSizes[variantInternalType] && Encoder.getSize(variantCount, defaultSizes[variantInternalType])) || null,
          size: variantDef.size || defaultSizes[variantInternalType] || null,
          count: variantCount,
          nested: variantChildSchema,
        };
      });

      return {
        nullable: itemDef.nullable || false,
        variants,
        count: 1,
        getSize: Encoder.getSize.bind(null, 1),
      };
    }

    // Handle regular array items
    const itemType = itemDef.type;
    const itemFormat = itemDef.format;
    const internalItemType = resolveType(itemType, itemFormat);
    const itemCount = itemDef.count || (internalItemType === 'binary' ? 4 : 1);
    const itemChildSchema = processArrayItemsNested(itemDef);

    return {
      nullable: itemDef.nullable || false,
      count: itemCount,
      getSize: Encoder.getSize.bind(null, itemCount),
      transformIn: (itemChildSchema !== undefined) ? Encoder[internalItemType].bind(null, itemChildSchema) : Encoder[internalItemType],
      transformOut: (itemChildSchema !== undefined) ? Decoder[internalItemType].bind(null, itemChildSchema) : Decoder[internalItemType],
    };
  }

  /** @private */
  function processArrayItemsNested(itemDef) {
    const itemType = itemDef.type;
    const isObject = (itemType === 'object');
    const isArray = (itemType === 'array');

    if (isObject === true) {
      return Schema(itemDef.schema, options);
    }

    if (isArray === true) {
      return processArrayItems(itemDef.items);
    }

    return undefined;
  }

  /** @private */
  function computeNestedVariant(variantDef) {
    const variantType = variantDef.type;
    const isObject = (variantType === 'object');
    const isArray = (variantType === 'array');
    let childSchema;

    if (isObject === true || isArray === true) {
      if (isObject === true) childSchema = Schema(variantDef.schema, options);
      if (isArray === true) {
        childSchema = processArrayItems(variantDef.items);
      }
    }

    return childSchema;
  }

  return Object.assign({}, writer, reader);
}
