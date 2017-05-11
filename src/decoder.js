/** Decoding utilities */

'use strict';

/* Local variables -----------------------------------------------------------*/

const pow = Math.pow;
const fromChar = String.fromCharCode;

/* Methods -------------------------------------------------------------------*/

function boolean(bytes) {
  return !!bytes[0];
}

function number(bytes) {
  if (bytes.length === 1) return (!(bytes[0] & 0x80))?bytes[0]:((0xff - bytes[0] + 1) * -1);
  if (bytes.length === 2) {
    const val = (bytes[0] << 8) | bytes[1];
    return (val & 0x8000) ? val | 0xFFFF0000 : val;
  }
  return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3]);
}

function unsigned(bytes) {
  if (bytes.length === 1) return bytes[0];
  if (bytes.length === 2) return bytes[0] << 8 | bytes[1];
  return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3]);
}

function string(encoding, bytes) {
  let res = [];
  for (let i = 0; i < bytes.length; i += encoding) {
    res.push(unsigned(bytes.slice(i, i + encoding)));
  }
  return fromChar.apply(null, res);
}

function array(schema, bytes) {
  const ret = [];
  for (let i = 0; i < bytes.length;) {
    const size = unsigned(bytes.slice(i, i + schema.count));
    i = (i + schema.count);
    ret.push(schema.transformOut(bytes.slice(i, i + size)));
    i = (i + size);
  }

  return ret;
}

function object(schema, bytes) {
  return schema.read(bytes);
}

/** Credit to @feross' ieee754 module */
function double(bytes) {
  let s = bytes[0];
  let e = (s & 127);
  e = e * 256 + bytes[1];
  let m = e & 15;
  s >>= 7;    
  e >>= 4;
  for (let im = 2; im <= 7; im++) {
    m = m * 256 + bytes[im];
  }
  if (e === 0) e = -1022;
  else if (e === 2047) return NaN;
  else {
    m += 4503599627370496;
    e -= 1023;
  }
  return (s ? -1 : 1) * m * pow(2, e - 52);
}

/* Exports -------------------------------------------------------------------*/

module.exports = { 
  boolean,
  number: double,
  int8: number,
  int16: number,
  int32: number,
  double,
  string: string.bind(null, 2),
  char8: string.bind(null, 1),
  char16: string.bind(null, 2),
  char32: string.bind(null, 4),
  array, 
  object,
  unsigned,
  unsigned8: unsigned,
  unsigned16: unsigned,
  unsigned32: unsigned
};