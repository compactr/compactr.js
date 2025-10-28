/** Data reader component */

/* Requires ------------------------------------------------------------------ */

import Decoder, { NULL_INDICATOR } from './decoder';

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

    // Check for presence byte if field is nullable
    if (key.nullable) {
      const presenceByte = bytes[caret];
      caret++; // Move past presence byte

      if (presenceByte === NULL_INDICATOR) {
        // Field is null - no size or content follows
        size = -1; // Use -1 as internal null marker
      }
      else {
        // Field is present - read size
        const sizeBytes = bytes.slice(caret, caret + key.count);
        size = key.size || Decoder.unsigned(sizeBytes);
        caret += key.count; // Move past size bytes
      }
    }
    else {
      // Non-nullable field - read size directly
      const sizeBytes = bytes.slice(caret, caret + key.count);
      size = key.size || Decoder.unsigned(sizeBytes);
      caret += key.count; // Move past size bytes
    }

    scope.header[index] = {
      key,
      size,
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
      // Handle nullable fields with size -1 (null marker detected)
      if (scope.header[i].key.nullable && scope.header[i].size === -1) {
        ret[scope.header[i].key.name] = null;
        continue;
      }

      ret[scope.header[i].key.name] = scope.header[i].key.transformOut(bytes.slice(caret, caret + scope.header[i].size));
      caret += scope.header[i].size;
    }
    return ret;
  }

  return { read, readHeader, readContent };
}
