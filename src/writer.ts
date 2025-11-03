import { NULL_INDICATOR, VARIANT_BASE } from './encoder';
import { matchesVariant } from './variant-matcher';

import { log } from './logger';

export default function Writer(scope) {
  function estimateBufferSize(keys) {
    let size = 1;

    for (let i = 0; i < keys.length; i++) {
      const field = scope.indices[keys[i]];

      size += field.nullable || field.variants ? 2 : 1;

      if (field.fixedSize) {
        size += field.fixedSize.length;
      }
      else {
        size += field.count || 1;
      }

      if (field.size) {
        size += field.size;
      }
      else {
        if (field.type === 'string') size += 32;
        else if (field.type === 'array') size += 64;
        else if (field.type === 'object') size += 128;
        else size += 16;
      }
    }

    return Math.max(Math.floor(size * 1.5), 256);
  }

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

    const estimatedSize = estimateBufferSize(keys);
    scope.buffer = Buffer.allocUnsafe(estimatedSize);
    scope.position = 0;

    scope.buffer[scope.position++] = keys.length;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      let keyData = data[key];
      const field = scope.indices[key];

      if (field.nullable && keyData === null) {
        ensureCapacity(2);
        scope.buffer[scope.position++] = field.index;
        scope.buffer[scope.position++] = NULL_INDICATOR;
        continue;
      }

      if (field.variants) {
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

        ensureCapacity(2);
        scope.buffer[scope.position++] = field.index;
        scope.buffer[scope.position++] = VARIANT_BASE + variantIndex;

        if (options !== undefined) {
          if (options.coerse === true && variantField.coerse) {
            keyData = variantField.coerse(keyData);
          }
          if (options.validate === true && variantField.validate) {
            variantField.validate(keyData);
          }
        }

        scope.position = writeFieldValue(keyData, variantField);
        continue;
      }

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

      scope.position = writeFieldValue(keyData, field);
    }

    return this;
  }

  function writeFieldValue(value, fieldOrVariant) {
    ensureCapacity(1024);

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
      return fieldOrVariant.transformIn(value, scope.buffer, scope.position);
    }

    const sizePos = scope.position;
    scope.position += fieldOrVariant.count;
    const dataStart = scope.position;

    const newPos = fieldOrVariant.transformIn(value, scope.buffer, scope.position);
    const size = newPos - dataStart;

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

  function filterKeys(data) {
    const res = [];
    const undeclaredKeys = [];

    for (const key in data) {
      if (!scope.itemsSet.has(key)) {
        undeclaredKeys.push(key);
        continue;
      }

      if (scope.indices[key].nullable && data[key] === null) {
        res.push(key);
        continue;
      }

      if (data[key] !== null && data[key] !== undefined) {
        res.push(key);
      }
    }

    if (undeclaredKeys.length > 0) {
      log(
        `Schema validation warning: Object contains undeclared properties that will not be serialized: ${undeclaredKeys.join(', ')}`,
      );
    }

    return res;
  }

  function writeToBuffer(data, buffer, pos) {
    const keys = filterKeys(data);

    buffer[pos++] = keys.length;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const keyData = data[key];
      const field = scope.indices[key];

      buffer[pos++] = field.index;

      if (field.nullable && keyData === null) {
        buffer[pos++] = NULL_INDICATOR;
        continue;
      }

      if (field.variants) {
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

        buffer[pos++] = VARIANT_BASE + variantIndex;

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
          const sizePos = pos;
          pos += variantField.count;
          const dataStart = pos;
          pos = variantField.transformIn(keyData, buffer, pos);
          const size = pos - dataStart;

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

      if (field.nullable) {
        buffer[pos++] = VARIANT_BASE;
      }

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
    return Buffer.from(scope.buffer.subarray(0, scope.position));
  }

  return { write, buffer, sizes, writeToBuffer };
}
