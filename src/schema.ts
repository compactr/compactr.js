import Encoder from './encoder';
import Decoder from './decoder';
import Reader from './reader';
import Writer from './writer';
import Converter from './converter';
import { canUseCodegen, generateWriteFunction } from './codegen';
import { writeFieldWithSize, processVariantWrite } from './buffer-utils';

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

export default function Schema(schema, options = {}) {
  let unwrappedSchema = schema;
  if (schema.type === 'object' && schema.properties) {
    unwrappedSchema = schema.properties;
  }

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
    'date-time': 9,
  };

  const scope = {
    schema: normalizedSchema,
    indices: {},
    items: Object.keys(normalizedSchema),
    buffer: [],
    options,
    indexToField: {},
    itemsSet: null,
  };
  scope.indices = preformat(normalizedSchema);

  for (const fieldName of scope.items) {
    scope.indexToField[scope.indices[fieldName].index] = scope.indices[fieldName];
  }

  scope.itemsSet = new Set(scope.items);

  const codegenInfo = canUseCodegen(scope.indices);
  if (codegenInfo.canGenerate) {
    const generatedFn = generateWriteFunction(scope, codegenInfo);
    if (generatedFn) {
      // Bind the generated function with required context and helpers
      scope.generatedWrite = function (data) {
        return generatedFn.call({ scope }, data, writeFieldWithSize, processVariantWrite);
      };
      if (options.debug) {
        const codegenCount = Object.values(codegenInfo.fields).filter(Boolean).length;
        const totalCount = Object.keys(codegenInfo.fields).length;
        console.log(`✓ Code generation enabled for ${codegenCount}/${totalCount} fields`);
      }
    }
  }
  else if (options.debug) {
    console.log('✗ Code generation disabled (no compatible fields)');
  }

  function resolveRef(ref, options) {
    if (!ref || !ref.startsWith('#/')) {
      throw new Error(`Invalid $ref format: ${ref}. Only internal references (#/...) are supported.`);
    }

    const parts = ref.split('/').slice(1);
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

  function normalizeFieldDefinition(fieldDef, options) {
    if (fieldDef.$ref) {
      if (!options.schemas) {
        throw new Error(`$ref "${fieldDef.$ref}" found but no schemas provided in options`);
      }
      let resolved = resolveRef(fieldDef.$ref, options);

      if (resolved.type === 'object' && resolved.properties && !resolved.schema) {
        resolved = { ...resolved };
        resolved.schema = resolved.properties;
        delete resolved.properties;
      }

      return normalizeFieldDefinition(resolved, options);
    }

    const normalized = { ...fieldDef };

    if (normalized.properties && !normalized.schema) {
      normalized.schema = normalizeSchema(normalized.properties, options);
      delete normalized.properties;
    }

    if (normalized.items) {
      normalized.items = normalizeFieldDefinition(normalized.items, options);
    }

    if (normalized.oneOf) {
      normalized.oneOf = normalized.oneOf.map(v => normalizeFieldDefinition(v, options));
    }
    if (normalized.anyOf) {
      normalized.anyOf = normalized.anyOf.map(v => normalizeFieldDefinition(v, options));
    }

    if (normalized.schema && typeof normalized.schema === 'object') {
      normalized.schema = normalizeSchema(normalized.schema, options);
    }

    return normalized;
  }

  function normalizeSchema(schema, options) {
    const normalized = {};
    for (const key in schema) {
      normalized[key] = normalizeFieldDefinition(schema[key], options);
    }
    return normalized;
  }

  const writer = Writer(scope);
  const reader = Reader(scope);

  function preformat(schema) {
    const ret = {};
    Object.keys(schema)
      .sort()
      .forEach((key, index) => {
        if (schema[key].oneOf || schema[key].anyOf) {
          const variantDefs = schema[key].oneOf || schema[key].anyOf;
          const variants = variantDefs.map((variantDef) => {
            const variantType = variantDef.type;
            const variantFormat = variantDef.format;
            const variantInternalType = resolveType(variantType, variantFormat);
            const variantCount = variantDef.count || (variantInternalType === 'binary' ? 4 : (variantInternalType === 'array' || variantInternalType === 'object' ? 2 : 1));
            const variantChildSchema = computeNestedVariant(variantDef);

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

        const fieldType = schema[key].type;
        const fieldFormat = schema[key].format;
        const internalType = resolveType(fieldType, fieldFormat);
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

  function computeNested(schema, key) {
    const keyType = schema[key].type;
    const isObject = (keyType === 'object');
    const isArray = (keyType === 'array');
    let childSchema;

    if (isObject === true || isArray === true) {
      if (isObject === true) {
        childSchema = Schema(schema[key].schema, options);
      }
      if (isArray === true) {
        childSchema = processArrayItems(schema[key].items);
      }
    }

    return childSchema;
  }

  function processArrayItems(itemDef) {
    if (itemDef.oneOf || itemDef.anyOf) {
      const variantDefs = itemDef.oneOf || itemDef.anyOf;
      const variants = variantDefs.map((variantDef) => {
        const variantType = variantDef.type;
        const variantFormat = variantDef.format;
        const variantInternalType = resolveType(variantType, variantFormat);
        const variantCount = variantDef.count || (variantInternalType === 'binary' ? 4 : (variantInternalType === 'array' || variantInternalType === 'object' ? 2 : 1));
        const variantChildSchema = processArrayItemsNested(variantDef);

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

  function computeNestedVariant(variantDef) {
    const variantType = variantDef.type;
    const isObject = (variantType === 'object');
    const isArray = (variantType === 'array');
    let childSchema;

    if (isObject === true || isArray === true) {
      if (isObject === true) {
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
