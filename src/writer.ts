/** Data writer component */

/* Requires ------------------------------------------------------------------ */

import { NULL_INDICATOR, PRESENT_INDICATOR } from './encoder';

/* Methods ------------------------------------------------------------------- */

export default function Writer(scope) {
  function write(data, options?) {
    scope.headerBytes = [0];
    scope.contentBytes = [];

    const keys = filterKeys(data);
    scope.headerBytes[0] = keys.length;
    for (let i = 0; i < keys.length; i++) {
      let keyData = data[keys[i]];

      // Handle nullable fields with null values
      if (scope.indices[keys[i]].nullable && keyData === null) {
        // Write header with NULL_INDICATOR (no size or content follows)
        scope.headerBytes.push(scope.indices[keys[i]].index, NULL_INDICATOR);
        continue;
      }

      // For nullable fields that are not null, add PRESENT_INDICATOR
      if (scope.indices[keys[i]].nullable) {
        scope.headerBytes.push(scope.indices[keys[i]].index, PRESENT_INDICATOR);
      }
      else {
        scope.headerBytes.push(scope.indices[keys[i]].index);
      }

      if (options !== undefined) {
        if (options.coerse === true) keyData = scope.indices[keys[i]].coerse(keyData);
        if (options.validate === true) scope.indices[keys[i]].validate(keyData);
      }

      // Add size and content
      const encoded = scope.indices[keys[i]].transformIn(keyData);
      addSizeAndContent(encoded, keys[i]);
    }

    return this;
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
    for (const key in data) {
      if (scope.items.indexOf(key) === -1) continue;

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

  return { write, headerBuffer, contentBuffer, buffer, typedArray, sizes };
}
