/** Data writer component */

/* Requires ------------------------------------------------------------------ */

import { NULL_INDICATOR, VARIANT_BASE } from './encoder';

/* Methods ------------------------------------------------------------------- */

export default function Writer(scope) {
  function write(data, options?) {
    scope.headerBytes = [0];
    scope.contentBytes = [];

    const keys = filterKeys(data, options);
    scope.headerBytes[0] = keys.length;
    for (let i = 0; i < keys.length; i++) {
      let keyData = data[keys[i]];
      const field = scope.indices[keys[i]];

      // Handle nullable fields with null values
      if (field.nullable && keyData === null) {
        // Write header with NULL_INDICATOR (no size or content follows)
        scope.headerBytes.push(field.index, NULL_INDICATOR);
        continue;
      }

      // Handle oneOf/anyOf fields
      if (field.variants) {
        // Determine which variant matches the data
        let variantIndex = -1;
        let variantField = null;

        for (let v = 0; v < field.variants.length; v++) {
          if (matchesVariant(keyData, field.variants[v])) {
            variantIndex = v;
            variantField = field.variants[v];
            break;
          }
        }

        if (variantIndex === -1) {
          throw new Error(`Data does not match any variant for field: ${keys[i]}`);
        }

        // Write field index and variant discriminator (1-indexed)
        scope.headerBytes.push(field.index, VARIANT_BASE + variantIndex);

        // Apply coercion/validation if needed
        if (options !== undefined) {
          if (options.coerse === true && variantField.coerse) {
            keyData = variantField.coerse(keyData);
          }
          if (options.validate === true && variantField.validate) {
            variantField.validate(keyData);
          }
        }

        // Encode using the matched variant's transformer
        const encoded = variantField.transformIn(keyData);
        addSizeAndContentForVariant(encoded, variantField);
        continue;
      }

      // Handle regular fields with discriminator byte if nullable
      if (field.nullable) {
        scope.headerBytes.push(field.index, VARIANT_BASE);
      }
      else {
        scope.headerBytes.push(field.index);
      }

      if (options !== undefined) {
        if (options.coerse === true && field.coerse) keyData = field.coerse(keyData);
        if (options.validate === true && field.validate) field.validate(keyData);
      }

      // Add size and content
      const encoded = field.transformIn(keyData);
      addSizeAndContent(encoded, keys[i]);
    }

    return this;
  }

  /** @private */
  function matchesVariant(data, variant) {
    const dataType = Array.isArray(data)
      ? 'array'
      : data === null
        ? 'null'
        : typeof data === 'boolean'
          ? 'boolean'
          : typeof data === 'number'
            ? 'number'
            : typeof data === 'string'
              ? 'string'
              : typeof data === 'object'
                ? 'object'
                : 'unknown';

    // Map internal types to JavaScript types
    // Number types: int32, int64, float, double
    if (variant.type === 'int32' || variant.type === 'int64'
      || variant.type === 'float' || variant.type === 'double') {
      return dataType === 'number';
    }

    // String types: string, uuid, ipv4, ipv6, date, date-time, binary
    if (variant.type === 'string' || variant.type === 'uuid'
      || variant.type === 'ipv4' || variant.type === 'ipv6'
      || variant.type === 'date' || variant.type === 'date-time'
      || variant.type === 'binary') {
      return dataType === 'string';
    }

    if (variant.type === 'boolean') {
      return dataType === 'boolean';
    }

    if (variant.type === 'array') {
      return dataType === 'array';
    }

    if (variant.type === 'object') {
      if (dataType !== 'object') return false;

      // For objects with schema keys, check if the data properties match
      if (variant.schemaKeys && variant.schemaKeys.length > 0) {
        const schemaKeys = variant.schemaKeys;
        const dataKeys = Object.keys(data);

        // Check if data keys match schema keys
        let matchCount = 0;
        for (const key of schemaKeys) {
          if (data.hasOwnProperty(key)) {
            matchCount++;
          }
        }

        // Require at least one matching key and 50% overlap
        // This helps distinguish between different object variants
        return matchCount > 0 && matchCount >= Math.min(schemaKeys.length, dataKeys.length) * 0.5;
      }

      return true;
    }

    return false;
  }

  /** @private */
  function addSizeAndContent(encoded, key) {
    if (scope.indices[key].fixedSize !== null) {
      scope.headerBytes.push(...scope.indices[key].fixedSize);
    }
    else {
      scope.headerBytes.push(...scope.indices[key].getSize(encoded.length));
      if (scope.indices[key].size !== encoded.length && scope.indices[key].size !== null) {
        const fixedSize = new Array(scope.indices[key].size).fill(0);
        const smallestSize = Math.min(encoded.length, fixedSize.length);
        fixedSize.splice(0, smallestSize, ...encoded.slice(0, smallestSize));
        return scope.contentBytes.push(...fixedSize);
      }
    }
    scope.contentBytes.push(...encoded);
  }

  /** @private */
  function addSizeAndContentForVariant(encoded, variant) {
    if (variant.fixedSize !== null) {
      scope.headerBytes.push(...variant.fixedSize);
    }
    else {
      scope.headerBytes.push(...variant.getSize(encoded.length));
      if (variant.size !== encoded.length && variant.size !== null) {
        const fixedSize = new Array(variant.size).fill(0);
        const smallestSize = Math.min(encoded.length, fixedSize.length);
        fixedSize.splice(0, smallestSize, ...encoded.slice(0, smallestSize));
        return scope.contentBytes.push(...fixedSize);
      }
    }
    scope.contentBytes.push(...encoded);
  }

  function sizes(data) {
    const s: any = {};
    for (const key in data) {
      if (data[key] instanceof Object) {
        s[key] = scope.indices[key].nested.sizes(data[key]);
        s.size = scope.indices[key].transformIn(data[key]).length;
      }
      else s[key] = scope.indices[key].transformIn(data[key]).length;
    }

    return s;
  }

  /** @private */
  function filterKeys(data) {
    const res = [];
    const undeclaredKeys = [];

    for (const key in data) {
      if (scope.items.indexOf(key) === -1) {
        undeclaredKeys.push(key);
        continue;
      }

      // Include nullable fields even when null
      if (scope.indices[key].nullable && data[key] === null) {
        res.push(key);
        continue;
      }

      // Skip non-nullable fields that are null or undefined
      if (data[key] !== null && data[key] !== undefined) {
        res.push(key);
      }
    }

    // Always warn about undeclared properties
    if (undeclaredKeys.length > 0) {
      console.warn(
        `Schema validation warning: Object contains undeclared properties that will not be serialized: ${undeclaredKeys.join(', ')}`,
      );
    }

    return res;
  }

  /** @private */
  function typedArray() {
    return [...scope.headerBytes, ...scope.contentBytes];
  }

  function headerBuffer() {
    return Buffer.from(scope.headerBytes);
  }

  function contentBuffer() {
    return Buffer.from(scope.contentBytes);
  }

  function buffer() {
    return Buffer.from(typedArray());
  }

  return { write, headerBuffer, contentBuffer, buffer, typedArray, sizes, matchesVariant };
}
