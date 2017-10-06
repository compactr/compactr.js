/** Data writer component */

'use strict';

/* Local variables -----------------------------------------------------------*/

const fastPush = Array.prototype.push;

/* Methods -------------------------------------------------------------------*/

function Writer(scope) {

  function write(data, options) {
    scope.headerBytes = [0];
    scope.contentBytes = [];

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
    fastPush.apply(scope.headerBytes, scope.indices[key].getSize(encoded.length));
    let res = encoded;
    if (scope.indices[key].size !== null) {
      if (scope.indices[key].size !== encoded.length) {
        if(scope.indices[key].size > encoded.length) {
          res = new Array(scope.indices[key].size).fill(0);
          res.splice(0, encoded.length, ...encoded);
        }
        else {
          res = encoded.slice(0, scope.indices[key].size);
        }
      }
    }
    fastPush.apply(scope.contentBytes, res);
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
    // return [...header, ...content];
    const res = [];
    fastPush.apply(res, header);
    fastPush.apply(res, content);
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

  return { write, headerBuffer, contentBuffer, buffer, sizes };
}

/* Exports -------------------------------------------------------------------*/

module.exports = Writer;