import { NULL_INDICATOR, VARIANT_BASE } from './encoder';
import { writeFieldWithSize, processVariantWrite } from './buffer-utils';
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
        if (options !== undefined) {
          for (let v = 0; v < field.variants.length; v++) {
            const variant = field.variants[v];
            if (options.coerse === true && variant.coerse) {
              keyData = variant.coerse(keyData);
            }
            if (options.validate === true && variant.validate) {
              variant.validate(keyData);
            }
          }
        }

        ensureCapacity(2);
        scope.buffer[scope.position++] = field.index;
        scope.position = processVariantWrite(scope.buffer, scope.position, keyData, field, `Field: ${keys[i]}`);
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

    return Buffer.from(scope.buffer.subarray(0, scope.position));
  }

  function writeFieldValue(value, fieldOrVariant) {
    ensureCapacity(1024);
    return writeFieldWithSize(scope.buffer, scope.position, value, fieldOrVariant);
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
        pos = processVariantWrite(buffer, pos, keyData, field, `Field: ${key}`);
        continue;
      }

      if (field.nullable) {
        buffer[pos++] = VARIANT_BASE;
      }

      pos = writeFieldWithSize(buffer, pos, keyData, field);
    }

    return pos;
  }

  return { write, sizes, writeToBuffer };
}
