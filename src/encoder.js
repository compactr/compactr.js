/** Encoding utilities */

'use strict';

/* Local variables -----------------------------------------------------------*/

const intMap = [null, unsigned8, unsigned16, null, unsigned32];
const abs = Math.abs;
const pow = Math.pow;
const ln2 = Math.LN2;
const log = Math.log;
const floor = Math.floor;
const bias = pow(2, 52);
const eIn = pow(2, -1022);
const eOut = pow(2, 1022) * bias;
const fastPush = Array.prototype.push;

/* Methods -------------------------------------------------------------------*/

function boolean(val) {
  return [val ? 1 : 0];
}

function int8(val) {
  return [(val < 0) ? 256 + val : val];
}

function int16(val) {
  if (val < 0) val = 0xffff + val + 1;
  return [val >> 8, val & 0xff];
}

function int32(val) {
  if (val < 0) val = 0xffffffff + val + 1;
  return [val >> 24, val >> 16, val >> 8, val & 0xff];
}

function unsigned8(val) { return [val & 0xff]; }
function unsigned16(val) { return [val >> 8, val & 0xff]; }
function unsigned32(val) { return [val >> 24, val >> 16, val >> 8, val & 0xff]; }

function string(encoding, val) {
  const chars = [];
  for (let i = 0; i < val.length; i++) {
    fastPush.apply(chars, encoding(val.charCodeAt(i)));
  }

  return chars;
}

function array(schema, val) {
  const ret = [];
  for (let i = 0; i < val.length; i++) {
    let encoded = schema.transformIn(val[i]);
    fastPush.apply(ret, schema.getSize(encoded.length));
    fastPush.apply(ret, encoded);
  }
  return ret;
}

function object(schema, val) {
  return schema.write(val).buffer();
}

/** Credit to @feross' ieee754 module */
function double(val) {
  var buffer = [];
  var e, m, c;
  var mLen = 52;
  var nBytes = 8;
  var eLen = 11;
  var eMax = 2047;
  var eBias = 1023;
  var rt = 0;
  var i = 7;
  var d = -1;
  var s = val <= 0 ? 1 : 0;
  val = abs(val);
  e = floor(log(val) / ln2);
  c = pow(2, -e);
  if (val * c < 1) {
    e--;
    c *= 2;
  }

  if (e + eBias >= 1) val += rt / c;
  else val += rt * eIn;
      
  if (val * c >= 2) {
    e++;
    c /= 2;
  }

  if (e + eBias >= eMax) {
    m = 0;
    e = eMax;
  } else if (e + eBias >= 1) {
    m = (val * c - 1) * bias
    e = e + eBias;
  } else {
    m = val * eOut;
    e = 0;
  }
  
  for (let a = 0; a < 6; a++) {
    buffer[i] = m & 0xff;
    i += d;
    m /= 256;
  }

  e = (e << 4) | m;
  for (let b = 0; b < 2; b++) {
    buffer[i] = e & 0xff;
    i += d;
    e /= 256;
  }

  buffer[i - d] |= s * 128;

  return buffer;
}

function getSize(count, byteLength) {
  return intMap[count](byteLength);
}

/* Exports -------------------------------------------------------------------*/

module.exports = {
  boolean,
  number: double,
  int8,
  int16,
  int32,
  double,
  string: string.bind(null, unsigned16),
  char8: string.bind(null, unsigned8),
  char16: string.bind(null, unsigned16),
  char32: string.bind(null, unsigned32),
  array,
  object,
  getSize,
  unsigned8,
  unsigned16,
  unsigned32
};