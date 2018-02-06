/** Data reader component */

'use asm';

/* Requires ------------------------------------------------------------------*/

const Decoder = require('./decoder');

/* Methods -------------------------------------------------------------------*/

function Reader(scope) {

  /**
   * Decodes an encoded buffer. Requires header bytes.
   * @param {Buffer} bytes
   * @returns {Object} The decoded buffer
   */
  function read(bytes) {
    readHeader(bytes);
    return readContent(bytes, scope.contentBegins);
  }

  /**
   * Reads only the header of an encoded buffer
   * @param {*} bytes 
   */
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

    scope.header[index] = {
      key,
      size: key.size || Decoder.unsigned(bytes.subarray(caret + 1, caret + key.count + 1))
    };
    return caret + key.count + 1;
  }

  /** @private */
  function getSchemaDef(index) {
    for (let i = 0; i < scope.items.length; i++) {
      if (scope.indices[scope.items[i]].index === index) return scope.indices[scope.items[i]];
    }
  }

  /**
   * Reads only a content buffer and returns an object with the decoded values 
   * @param {Buffer} bytes The content buffer 
   * @param {Integer} caret The content bytes offset, if the bytes also include an header
   * @returns {Object} An object with the decoded values
   */
  function readContent(bytes, caret) {
    caret = caret || 0;
    const ret = {};
    if (scope.options.keyOrder === true) {
      for (let i = 0; i < scope.items.length; i++) {
        ret[scope.items[i]] = undefined;
      }
    }
    for (let i = 0; i < scope.header.length; i++) {
      ret[scope.header[i].key.name] = scope.header[i].key.transformOut(bytes.subarray(caret, caret + scope.header[i].size));
      caret += scope.header[i].size;
    }
    return ret;
  }

  return { read, readHeader, readContent };
}

/* Exports -------------------------------------------------------------------*/

module.exports = Reader;
