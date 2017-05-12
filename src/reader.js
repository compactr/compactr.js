/** Data writer component */

'use strict';

/* Requires ------------------------------------------------------------------*/

const Decoder = require('./decoder');

/* Methods -------------------------------------------------------------------*/

function Reader(scope) {

  function read(bytes) {
    readMap(bytes);
    return readData(bytes);
  }

  function readMap(bytes) {
    scope.header.length = 0;
    let caret = 1;
    const keys = bytes[0];
    for (let i = 0; i < keys; i++) {
      caret = readKey(bytes, caret);
    }
    scope.contentBegins = caret;

    return this;
  }

  function readKey(bytes, caret) {
    const key = getSchemaDef(bytes[caret]);

    scope.header.push({
      key,
      size: key.size || Decoder.unsigned(bytes.slice(caret + 1, caret + key.count + 1))
    });
    return caret + key.count + 1;
  }

  function getSchemaDef(index) {
    for (let i = 0; i < scope.items.length; i++) {
      if (scope.indices[scope.items[i]].index === index) return scope.indices[scope.items[i]];
    }
  }

  function readData(bytes) {
    let caret = scope.contentBegins;
    const ret = {};
    for (let i = 0; i < scope.header.length; i++) {
      ret[scope.header[i].key.name] = scope.header[i].key.transformOut(bytes.slice(caret, caret + scope.header[i].size));
      caret += scope.header[i].size;
    }
    return ret;
  }

  return { read, readMap, readData };
}

/* Exports -------------------------------------------------------------------*/

module.exports = Reader;