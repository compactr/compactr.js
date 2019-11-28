/** Decoding utilities */

/* Local variables -----------------------------------------------------------*/

const fromChar = String.fromCharCode;

/* Methods -------------------------------------------------------------------*/

/** @private */
function boolean(bytes) {
  return !!bytes[0];
}

/** @private */
function int8(bytes) {
  return (!(bytes[0] & 0x80))?bytes[0]:((0xff - bytes[0] + 1) * -1);
}

/** @private */
function int16(bytes) {
  const val = (bytes[0] << 8) | bytes[1];
  return (val & 0x8000) ? val | 0xFFFF0000 : val;
}

/** @private */
function int32(bytes) {
  return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3])
}

function uint8(bytes) {
  return bytes[0];
}

function uint16(bytes) {
  return bytes[0] << 8 | bytes[1];
}

/** @private */
function unsigned(bytes) {
  if (bytes.length === 1) return uint8(bytes);
  if (bytes.length === 2) return uint16(bytes);
  return int32(bytes);
}

/** @private */
function string(bytes) {
  let res = [];
  for (let i = 0; i < bytes.length; i += 2) {
    res.push(unsigned([bytes[i], bytes[i + 1]]));
  }
  return fromChar(...res);
}

/** @private */
function char8(bytes) {
  return fromChar(...bytes);
}

/** @private */
function char32(bytes) {
  let res = [];
  for (let i = 0; i < bytes.length; i += 4) {
    res.push(int32([bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]]));
  }
  return fromChar(...res);
}

/** @private */
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

/** @private */
function object(schema, bytes) {
  return schema.read(bytes);
}

/**
 * Credit to @feross' ieee754 module
 * @private
 */
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
  return (s ? -1 : 1) * m * Math.pow(2, e - 52);
}

/* Exports -------------------------------------------------------------------*/

module.exports = { 
  boolean,
  number: double,
  int8,
  int16,
  int32,
  double,
  string,
  char8,
  char16: string,
  char32,
  array, 
  object,
  unsigned,
  unsigned8: uint8,
  unsigned16: uint16,
  unsigned32: int32,
};