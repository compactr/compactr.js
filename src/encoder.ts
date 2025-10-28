/** Encoding utilities */

/* Local variables ----------------------------------------------------------- */

const intMap = [null, unsigned8, unsigned16, null, unsigned32];

// Presence indicators for nullable fields
export const NULL_INDICATOR = 0x00; // Field is null
export const PRESENT_INDICATOR = 0x01; // Field is present (not null)

/* Methods ------------------------------------------------------------------- */

/** @private */
function boolean(val) {
  return [val ? 1 : 0];
}

/** @private */
function int32(val) {
  if (val < 0) val = 0xffffffff + val + 1;
  return [val >> 24, val >> 16, val >> 8, val & 0xff];
}

/** @private */
function unsigned8(val) {
  return [val & 0xff];
}

/** @private */
function unsigned16(val) {
  return [val >> 8, val & 0xff];
}

/** @private */
function unsigned32(val) {
  return [val >> 24, val >> 16, val >> 8, val & 0xff];
}

/** @private */
function string(val) {
  const chars = [];
  for (let i = 0; i < val.length; i++) {
    const code = val.charCodeAt(i);
    chars.push(code >> 8, code & 0xff);
  }

  return chars;
}

/** @private */
function array(schema, val) {
  const ret = [];
  for (let i = 0; i < val.length; i++) {
    const encoded = schema.transformIn(val[i]);
    ret.push(...schema.getSize(encoded.length), ...encoded);
  }
  return ret;
}

/** @private */
function object(schema, val) {
  return schema.write(val).typedArray();
}

/**
 * IEEE 754 single precision (32-bit float)
 * Simplified implementation using JavaScript's Float32Array
 * @private
 */
function float(val) {
  // Use Float32Array to get proper IEEE 754 single precision encoding
  const floatArray = new Float32Array(1);
  const byteArray = new Uint8Array(floatArray.buffer);

  floatArray[0] = val;

  // Return bytes in big-endian order to match double implementation
  return [byteArray[3], byteArray[2], byteArray[1], byteArray[0]];
}

/**
 * IEEE 754 double precision (64-bit float)
 * Simplified implementation using JavaScript's Float64Array
 * @private
 */
function double(val) {
  // Use Float64Array to get proper IEEE 754 double precision encoding
  const doubleArray = new Float64Array(1);
  const byteArray = new Uint8Array(doubleArray.buffer);

  doubleArray[0] = val;

  // Return bytes in big-endian order
  return [
    byteArray[7], byteArray[6], byteArray[5], byteArray[4],
    byteArray[3], byteArray[2], byteArray[1], byteArray[0],
  ];
}

/**
 * 64-bit integer encoding (uses double for JavaScript compatibility)
 * JavaScript's Number type can safely represent integers up to 2^53-1
 * @private
 */
function int64(val) {
  return double(val);
}

/** @private */
function getSize(count, byteLength) {
  return intMap[count](byteLength);
}

/* Exports ------------------------------------------------------------------- */

export default {
  boolean,
  int32,
  int64,
  float,
  double,
  string,
  array,
  object,
  getSize,
};
