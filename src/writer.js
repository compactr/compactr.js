/** Data writer component */

/* Methods -------------------------------------------------------------------*/

function Writer(scope) {

  /**
   * Start writing some data against a schema
   * @param {*} data The data to be encoded
   * @param {Object (coerce: {boolean}, validate: {boolean})} options The options for the encoding
   * @returns {Writer} Self reference
   */
  function write(data, options) {
    scope.headerBytes = [0];
    scope.contentBytes = [];

    const keys = filterKeys(data);
    scope.headerBytes[0] = keys.length;
    for (let i = 0; i < keys.length; i++) {
      let keyData = data[keys[i]];
      if (options !== undefined) {
        if (options.coerse === true) keyData = scope.indices[keys[i]].coerse(keyData);
        if (options.validate === true) scope.indices[keys[i]].validate(keyData);
      }
      splitBytes(scope.indices[keys[i]].transformIn(keyData), keys[i]);
    }

    return this;
  }

  /** @private */
  function splitBytes(encoded, key) {
    if (scope.indices[key].fixedSize !== null) {
      scope.headerBytes.push(scope.indices[key].index, ...scope.indices[key].fixedSize);
    }
    else {
      scope.headerBytes.push(scope.indices[key].index, ...scope.indices[key].getSize(encoded.length));
      if(scope.indices[key].size !== encoded.length && scope.indices[key].size !== null) {
        let fixedSize = new Array(scope.indices[key].size).fill(0);
        let smallestSize = Math.min(encoded.length, fixedSize.length);
        fixedSize.splice(0, smallestSize, ...encoded.slice(0, smallestSize));
        return scope.contentBytes.push(...fixedSize);
      }
    }
    scope.contentBytes.push(...encoded);
  }

  /**
   * Returns the byte sizes of a data object, for insight or troubleshooting
   * @param {*} data The data to extract size information of
   * @returns {Object} The detailed sizes information
   */
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

  /** @private */
  function filterKeys(data) {
    const res = [];
    for (let key in data) {
      if (scope.items.indexOf(key) !== -1 && data[key] !== null && data[key] !== undefined) res.push(key);
    }
    return res;
  }

  /** @private */
  function concat(header, content) {
    return [...header, ...content];
  }

  /**
   * Returns the bytes from the header of the encoded data buffer.
   * A fresh schema with no written data will return a blank, usable for partial encodings.
   * @returns {Buffer} The header buffer
   */
  function headerBuffer() {
    return Buffer.from(scope.headerBytes);
  }

  /**
   * Returns the bytes from the content of the encoded data buffer.
   * @returns {Buffer} The content buffer
   */
  function contentBuffer() {
    return Buffer.from(scope.contentBytes);
  }

  /**
   * Returns the bytes from the header AND content of the encoded data buffer.
   * @returns {Buffer} The data buffer
   */
  function buffer() {
    return Buffer.from(concat(scope.headerBytes, scope.contentBytes));
  }

  return { write, headerBuffer, contentBuffer, buffer, sizes };
}

/* Exports -------------------------------------------------------------------*/

module.exports = Writer;