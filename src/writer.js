/** Data writer component */

'use strict';

/* Methods -------------------------------------------------------------------*/

function Writer(scope) {

  function write(data, options) {
    clear();

    const keys = filterKeys(data);
    scope.headerBytes[0] = keys.length;
    for (let i = 0; i < keys.length; i++) {
      let keyData = data[keys[i]];
      if (keyData === null || keyData === undefined) {
        scope.headerBytes[0] -= 1;
        continue;
      }
      if (options !== undefined) {
        if (options.coerse === true) keyData = scope.indices[keys[i]].coerse(keyData);
        if (options.validate === true) scope.indices[keys[i]].validate(keyData);
      } 
      splitBytes(scope.indices[keys[i]].transformIn(keyData), keys[i]);
    }

    return this;
  }

  function splitBytes(encoded, key) {
    scope.headerBytes.push(scope.indices[key].index);
    scope.headerBytes.push.apply(scope.headerBytes, scope.indices[key].getSize(encoded.length));
    scope.contentBytes.push.apply(scope.contentBytes, encoded);
  }

  function clear() {
    scope.headerBytes = [0];
    scope.contentBytes = [];
  }

  function sizes(data) {
    const s = {};
    for (let key in data) {
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
    for (let key in data) {
      if (scope.items.indexOf(key) !== -1) res.push(key);
    }
    return res;
  }

  function concat(header, content) {
    const res = [];
    res.push.apply(res, header);
    res.push.apply(res, content);
    return res;
  }

  function headerBuffer() {
    return Buffer.from(scope.headerBytes);
  }

  function contentBuffer() {
    return Buffer.from(scope.contentBytes);
  }

  function buffer() {
    return Buffer.from(concat(scope.headerBytes, scope.contentBytes));
  }

  function headerArray() {
    return scope.headerBytes;
  }

  function contentArray() {
    return scope.contentBytes;
  }

  function array() {
    return concat(scope.headerBytes, scope.contentBytes);
  }

  return { write, headerBuffer, headerArray, contentBuffer, contentArray, buffer, array, sizes };
}

/* Exports -------------------------------------------------------------------*/

module.exports = Writer;