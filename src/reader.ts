/** Data reader component */

/* Requires ------------------------------------------------------------------ */

import Decoder, { NULL_INDICATOR, VARIANT_BASE } from './decoder';

/* Methods ------------------------------------------------------------------- */

export default function Reader(scope) {
  function read(bytes) {
    readHeader(bytes);
    return readContent(bytes, scope.contentBegins);
  }

  function readHeader(bytes) {
    scope.header = [];
    let caret = 1;
    const keys = bytes[0];
    for (let i = 0; i < keys; i++) {
      caret = readKey(bytes, caret, i);
    }
    scope.contentBegins = caret;

    return this;
  }

  /** @private */
  function readKey(bytes, caret, index) {
    const key = getSchemaDef(bytes[caret]);
    caret++; // Move past field index

    let size;
    let variantIndex = null;

    // Check for discriminator byte if field is nullable or has variants
    if (key.nullable || key.variants) {
      const discriminatorByte = bytes[caret];
      caret++; // Move past discriminator byte

      if (discriminatorByte === NULL_INDICATOR) {
        // Field is null - no size or content follows
        size = -1; // Use -1 as internal null marker
      }
      else {
        // For variants, extract which variant to use (0-indexed internally)
        if (key.variants) {
          variantIndex = discriminatorByte - VARIANT_BASE;
          if (variantIndex < 0 || variantIndex >= key.variants.length) {
            throw new Error(`Invalid variant discriminator: ${discriminatorByte}`);
          }
          // Use the variant's metadata for size reading
          const variant = key.variants[variantIndex];
          const sizeBytes = bytes.slice(caret, caret + variant.count);
          size = variant.size || Decoder.unsigned(sizeBytes);
          caret += variant.count; // Move past size bytes
        }
        else {
          // Regular nullable field is present - read size
          const sizeBytes = bytes.slice(caret, caret + key.count);
          size = key.size || Decoder.unsigned(sizeBytes);
          caret += key.count; // Move past size bytes
        }
      }
    }
    else {
      // Non-nullable, non-variant field - read size directly
      const sizeBytes = bytes.slice(caret, caret + key.count);
      size = key.size || Decoder.unsigned(sizeBytes);
      caret += key.count; // Move past size bytes
    }

    scope.header[index] = {
      key,
      size,
      variantIndex,
    };
    return caret;
  }

  /** @private */
  function getSchemaDef(index) {
    for (let i = 0; i < scope.items.length; i++) {
      if (scope.indices[scope.items[i]].index === index) return scope.indices[scope.items[i]];
    }
  }

  function readContent(bytes, caret?) {
    caret = caret || 0;
    const ret = {};
    if (scope.options.keyOrder === true) {
      for (let i = 0; i < scope.items.length; i++) {
        ret[scope.items[i]] = undefined;
      }
    }
    for (let i = 0; i < scope.header.length; i++) {
      // Handle null values (size -1 indicates null)
      if (scope.header[i].size === -1) {
        ret[scope.header[i].key.name] = null;
        continue;
      }

      // Handle variant fields
      if (scope.header[i].variantIndex !== null && scope.header[i].key.variants) {
        const variant = scope.header[i].key.variants[scope.header[i].variantIndex];
        ret[scope.header[i].key.name] = variant.transformOut(bytes.slice(caret, caret + scope.header[i].size));
        caret += scope.header[i].size;
        continue;
      }

      // Handle regular fields
      ret[scope.header[i].key.name] = scope.header[i].key.transformOut(bytes.slice(caret, caret + scope.header[i].size));
      caret += scope.header[i].size;
    }
    return ret;
  }

  return { read, readHeader, readContent };
}
