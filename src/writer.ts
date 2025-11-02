/** Data writer component */

/* Requires ------------------------------------------------------------------ */

import { NULL_INDICATOR, VARIANT_BASE } from './encoder';
import { matchesVariant } from './variant-matcher';

/* Methods ------------------------------------------------------------------- */

export default function Writer(scope) {
  /**
   * Estimate buffer size for pre-allocation
   * Conservative estimate to minimize reallocation
   */
  function estimateBufferSize(keys) {
    let size = 1; // Field count byte

    for (let i = 0; i < keys.length; i++) {
      const field = scope.indices[keys[i]];

      // Field index (1 byte) + optional discriminator (1 byte)
      size += field.nullable || field.variants ? 2 : 1;

      // Size marker bytes
      if (field.fixedSize) {
        size += field.fixedSize.length;
      }
      else {
        size += field.count || 1;
      }

      // Estimated data size
      if (field.size) {
        // Fixed size field (int32, float, etc.)
        size += field.size;
      }
      else {
        // Variable size field - estimate conservatively
        // For typical API fields: strings ~20 bytes, arrays ~50 bytes, objects ~100 bytes
        if (field.type === 'string') size += 32;
        else if (field.type === 'array') size += 64;
        else if (field.type === 'object') size += 128;
        else size += 16; // Other variable types
      }
    }

    // Add 50% buffer for safety
    return Math.max(Math.floor(size * 1.5), 256);
  }

  /**
   * Ensure buffer has capacity and grow if needed
   */
  function ensureCapacity(needed) {
    if (scope.position + needed > scope.buffer.length) {
      const newSize = Math.max(scope.buffer.length * 2, scope.position + needed);
      const newBuffer = Buffer.allocUnsafe(newSize);
      scope.buffer.copy(newBuffer, 0, 0, scope.position);
      scope.buffer = newBuffer;
    }
  }

  function write(data, options?) {
    const keys = filterKeys(data, options);

    // Pre-allocate buffer based on estimation
    // Use Buffer.allocUnsafe for performance and compatibility with Buffer.write()
    const estimatedSize = estimateBufferSize(keys);
    scope.buffer = Buffer.allocUnsafe(estimatedSize);
    scope.position = 0;

    // Write field count
    scope.buffer[scope.position++] = keys.length;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      let keyData = data[key];
      const field = scope.indices[key]; // Performance: Single lookup, reused throughout

      // Handle nullable fields with null values
      if (field.nullable && keyData === null) {
        // Write field index and NULL_INDICATOR (no size or content follows)
        ensureCapacity(2);
        scope.buffer[scope.position++] = field.index;
        scope.buffer[scope.position++] = NULL_INDICATOR;
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
        ensureCapacity(2);
        scope.buffer[scope.position++] = field.index;
        scope.buffer[scope.position++] = VARIANT_BASE + variantIndex;

        // Apply coercion/validation if needed
        if (options !== undefined) {
          if (options.coerse === true && variantField.coerse) {
            keyData = variantField.coerse(keyData);
          }
          if (options.validate === true && variantField.validate) {
            variantField.validate(keyData);
          }
        }

        // NEW API: Write size and value directly to buffer
        scope.position = writeFieldValue(keyData, variantField);
        continue;
      }

      // Handle regular fields with discriminator byte if nullable
      if (field.nullable) {
        ensureCapacity(2);
        scope.buffer[scope.position++] = field.index;
        scope.buffer[scope.position++] = VARIANT_BASE;
      }
      else {
        ensureCapacity(1);
        scope.buffer[scope.position++] = field.index;
      }

      if (options !== undefined) {
        if (options.coerse === true && field.coerse) keyData = field.coerse(keyData);
        if (options.validate === true && field.validate) field.validate(keyData);
      }

      // NEW API: Write size and value directly to buffer
      scope.position = writeFieldValue(keyData, field);
    }

    return this;
  }

  /**
   * Write field value using new encoder API
   * Encoders now write directly to buffer and return new position
   * For fixed-size fields, writes size then data
   * For variable-size fields, reserves space for size, writes data, fills in size
   * @returns new position
   */
  function writeFieldValue(value, fieldOrVariant) {
    ensureCapacity(1024); // Ensure some headroom (will grow if needed)

    // Fixed-size fields: write size then data directly
    if (fieldOrVariant.size) {
      const count = fieldOrVariant.count;
      if (count === 1) scope.buffer[scope.position++] = fieldOrVariant.size;
      else if (count === 2) {
        scope.buffer[scope.position++] = fieldOrVariant.size >> 8;
        scope.buffer[scope.position++] = fieldOrVariant.size & 0xff;
      }
      else if (count === 4) {
        scope.buffer[scope.position++] = fieldOrVariant.size >> 24;
        scope.buffer[scope.position++] = fieldOrVariant.size >> 16;
        scope.buffer[scope.position++] = fieldOrVariant.size >> 8;
        scope.buffer[scope.position++] = fieldOrVariant.size & 0xff;
      }
      // Call encoder with new API: (val, buffer, pos) => newPos
      return fieldOrVariant.transformIn(value, scope.buffer, scope.position);
    }

    // Variable-size fields: reserve space for size, write data, fill in size
    const sizePos = scope.position;
    scope.position += fieldOrVariant.count; // Reserve space for size
    const dataStart = scope.position;

    // Call encoder with new API: (val, buffer, pos) => newPos
    const newPos = fieldOrVariant.transformIn(value, scope.buffer, scope.position);
    const size = newPos - dataStart;

    // Fill in size at reserved position
    if (fieldOrVariant.count === 1) {
      scope.buffer[sizePos] = size & 0xff;
    }
    else if (fieldOrVariant.count === 2) {
      scope.buffer[sizePos] = size >> 8;
      scope.buffer[sizePos + 1] = size & 0xff;
    }
    else if (fieldOrVariant.count === 4) {
      scope.buffer[sizePos] = size >> 24;
      scope.buffer[sizePos + 1] = size >> 16;
      scope.buffer[sizePos + 2] = size >> 8;
      scope.buffer[sizePos + 3] = size & 0xff;
    }

    return newPos;
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
      // Performance: O(1) Set lookup instead of O(n) indexOf
      if (!scope.itemsSet.has(key)) {
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

  /**
   * Write to buffer at specific position (for nested objects)
   * Used by object encoder when writing nested schemas
   * @returns new position
   */
  function writeToBuffer(data, buffer, pos) {
    const keys = filterKeys(data);

    // Write field count
    buffer[pos++] = keys.length;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const keyData = data[key];
      const field = scope.indices[key];

      // Write field index
      buffer[pos++] = field.index;

      // Handle nullable null values
      if (field.nullable && keyData === null) {
        buffer[pos++] = NULL_INDICATOR;
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
          throw new Error(`Data does not match any variant for field: ${key}`);
        }

        // Write variant discriminator
        buffer[pos++] = VARIANT_BASE + variantIndex;

        // For fixed-size types, write size then data
        if (variantField.size) {
          const count = variantField.count;
          if (count === 1) buffer[pos++] = variantField.size;
          else if (count === 2) {
            buffer[pos++] = variantField.size >> 8;
            buffer[pos++] = variantField.size & 0xff;
          }
          else if (count === 4) {
            buffer[pos++] = variantField.size >> 24;
            buffer[pos++] = variantField.size >> 16;
            buffer[pos++] = variantField.size >> 8;
            buffer[pos++] = variantField.size & 0xff;
          }
          pos = variantField.transformIn(keyData, buffer, pos);
        }
        else {
          // Variable size - reserve space for size, write data, fill in size
          const sizePos = pos;
          pos += variantField.count; // Reserve space
          const dataStart = pos;
          pos = variantField.transformIn(keyData, buffer, pos);
          const size = pos - dataStart;

          // Fill in size
          if (variantField.count === 1) buffer[sizePos] = size & 0xff;
          else if (variantField.count === 2) {
            buffer[sizePos] = size >> 8;
            buffer[sizePos + 1] = size & 0xff;
          }
          else if (variantField.count === 4) {
            buffer[sizePos] = size >> 24;
            buffer[sizePos + 1] = size >> 16;
            buffer[sizePos + 2] = size >> 8;
            buffer[sizePos + 3] = size & 0xff;
          }
        }
        continue;
      }

      // Add presence indicator for nullable non-null
      if (field.nullable) {
        buffer[pos++] = VARIANT_BASE;
      }

      // For fixed-size, write size then data
      if (field.size) {
        const count = field.count;
        if (count === 1) buffer[pos++] = field.size;
        else if (count === 2) {
          buffer[pos++] = field.size >> 8;
          buffer[pos++] = field.size & 0xff;
        }
        else if (count === 4) {
          buffer[pos++] = field.size >> 24;
          buffer[pos++] = field.size >> 16;
          buffer[pos++] = field.size >> 8;
          buffer[pos++] = field.size & 0xff;
        }
        pos = field.transformIn(keyData, buffer, pos);
      }
      else {
        // Variable size - reserve, write, fill
        const sizePos = pos;
        pos += field.count;
        const dataStart = pos;
        pos = field.transformIn(keyData, buffer, pos);
        const size = pos - dataStart;

        if (field.count === 1) buffer[sizePos] = size & 0xff;
        else if (field.count === 2) {
          buffer[sizePos] = size >> 8;
          buffer[sizePos + 1] = size & 0xff;
        }
        else if (field.count === 4) {
          buffer[sizePos] = size >> 24;
          buffer[sizePos + 1] = size >> 16;
          buffer[sizePos + 2] = size >> 8;
          buffer[sizePos + 3] = size & 0xff;
        }
      }
    }

    return pos;
  }

  function buffer() {
    // Return trimmed buffer (only the bytes that were written)
    return Buffer.from(scope.buffer.subarray(0, scope.position));
  }

  return { write, buffer, sizes, writeToBuffer };
}
