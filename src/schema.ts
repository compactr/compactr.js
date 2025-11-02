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
  // Handle top-level schema object (OpenAPI format)
  // If schema has type: 'object' and properties, unwrap it
  let unwrappedSchema = schema;
  if (schema.type === 'object' && schema.properties) {
    unwrappedSchema = schema.properties;
  }

  // Normalize OpenAPI schema format to internal format
  const normalizedSchema = normalizeSchema(unwrappedSchema, options);

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
    schema: normalizedSchema,
    indices: {},
    items: Object.keys(normalizedSchema),
    buffer: [],
    options,
    indexToField: {}, // Performance: O(1) reverse lookup from index to field
    itemsSet: null, // Performance: O(1) field validation in writer
  };
  scope.indices = preformat(normalizedSchema);

  // Build reverse index map for O(1) lookups during deserialization
  for (const fieldName of scope.items) {
    scope.indexToField[scope.indices[fieldName].index] = scope.indices[fieldName];
  }

  // Build Set for O(1) field validation during serialization
  scope.itemsSet = new Set(scope.items);

  /** @private */
  function resolveRef(ref, options) {
    if (!ref || !ref.startsWith('#/')) {
      throw new Error(`Invalid $ref format: ${ref}. Only internal references (#/...) are supported.`);
    }

    const parts = ref.split('/').slice(1); // Remove leading '#'
    let resolved = options.schemas;

    for (const part of parts) {
      if (!resolved || typeof resolved !== 'object') {
        throw new Error(`Cannot resolve $ref: ${ref}`);
      }
      resolved = resolved[part];
    }

    if (!resolved) {
      throw new Error(`$ref not found: ${ref}`);
    }

    return resolved;
  }

  /** @private */
  function normalizeFieldDefinition(fieldDef, options) {
    // Handle $ref
    if (fieldDef.$ref) {
      if (!options.schemas) {
        throw new Error(`$ref "${fieldDef.$ref}" found but no schemas provided in options`);
      }
      // Resolve the reference
      let resolved = resolveRef(fieldDef.$ref, options);

      // Unwrap if the component is a wrapped object schema
      if (resolved.type === 'object' && resolved.properties && !resolved.schema) {
        resolved = { ...resolved };
        resolved.schema = resolved.properties;
        delete resolved.properties;
      }

      // Normalize the resolved component
      return normalizeFieldDefinition(resolved, options);
    }

    // Create a copy to avoid mutating the original
    const normalized = { ...fieldDef };

    // Transform OpenAPI 'properties' to internal 'schema'
    if (normalized.properties && !normalized.schema) {
      normalized.schema = normalizeSchema(normalized.properties, options);
      delete normalized.properties;
    }

    // Normalize nested items
    if (normalized.items) {
      normalized.items = normalizeFieldDefinition(normalized.items, options);
    }

    // Normalize oneOf/anyOf variants
    if (normalized.oneOf) {
      normalized.oneOf = normalized.oneOf.map(v => normalizeFieldDefinition(v, options));
    }
    if (normalized.anyOf) {
      normalized.anyOf = normalized.anyOf.map(v => normalizeFieldDefinition(v, options));
    }

    // Normalize nested schema
    if (normalized.schema && typeof normalized.schema === 'object') {
      normalized.schema = normalizeSchema(normalized.schema, options);
    }

    return normalized;
  }

  /** @private */
  function normalizeSchema(schema, options) {
    const normalized = {};
    for (const key in schema) {
      normalized[key] = normalizeFieldDefinition(schema[key], options);
    }
    return normalized;
  }
  const writer = Writer(scope);
  const reader = Reader(scope);

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
            // Binary fields need 4 bytes, arrays/objects need 2 bytes for size counters
            const variantCount = variantDef.count || (variantInternalType === 'binary' ? 4 : (variantInternalType === 'array' || variantInternalType === 'object' ? 2 : 1));
            const variantChildSchema = computeNestedVariant(variantDef);

            // For object variants, extract schema keys for variant matching
            const schemaKeys = (variantInternalType === 'object' && variantDef.schema)
              ? Object.keys(variantDef.schema)
              : null;

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
              size: defaultSizes[variantInternalType] || null,
              count: variantCount,
              nested: variantChildSchema,
              schemaKeys,
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
        // Binary fields need 4 bytes, arrays/objects need 2 bytes for size counters
        const count = schema[key].count || (internalType === 'binary' ? 4 : (internalType === 'array' || internalType === 'object' ? 2 : 1));
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
          size: defaultSizes[internalType] || null,
          count,
          nested: childSchema,
        };
      });

    return ret;
  }

  /** @private */
  function computeNested(schema, key) {
    const keyType = schema[key].type;
    const isObject = (keyType === 'object');
    const isArray = (keyType === 'array');
    let childSchema;

    if (isObject === true || isArray === true) {
      if (isObject === true) {
        // After normalization, schema should always be present for objects
        childSchema = Schema(schema[key].schema, options);
      }
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
        const variantCount = variantDef.count || (variantInternalType === 'binary' ? 4 : (variantInternalType === 'array' || variantInternalType === 'object' ? 2 : 1));
        const variantChildSchema = processArrayItemsNested(variantDef);

        // For object variants, extract schema keys for variant matching
        const schemaKeys = (variantInternalType === 'object' && variantDef.schema)
          ? Object.keys(variantDef.schema)
          : null;

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
          size: defaultSizes[variantInternalType] || null,
          count: variantCount,
          nested: variantChildSchema,
          schemaKeys,
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
    const itemCount = itemDef.count || (internalItemType === 'binary' ? 4 : (internalItemType === 'array' || internalItemType === 'object' ? 2 : 1));
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
      // After normalization, schema should always be present for objects
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
      if (isObject === true) {
        // After normalization, schema should always be present for objects
        childSchema = Schema(variantDef.schema, options);
      }
      if (isArray === true) {
        childSchema = processArrayItems(variantDef.items);
      }
    }

    return childSchema;
  }

  return Object.assign({}, writer, reader);
}
