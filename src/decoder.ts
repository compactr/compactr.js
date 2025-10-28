/** Decoding utilities */

/* Local variables ----------------------------------------------------------- */

const fromChar = String.fromCharCode;

// Presence indicators for nullable fields
export const NULL_INDICATOR = 0x00; // Field is null
export const PRESENT_INDICATOR = 0x01; // Field is present (not null)

/* Methods ------------------------------------------------------------------- */

/** @private */
function boolean(bytes) {
  return !!bytes[0];
}

/** @private */
function int32(bytes) {
  return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | (bytes[3]);
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
  const res = [];
  for (let i = 0; i < bytes.length; i += 2) {
    const code = (bytes[i] << 8) | bytes[i + 1];
    res.push(code);
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
 * IEEE 754 single precision (32-bit float) decoder
 * Simplified implementation using JavaScript's Float32Array
 * @private
 */
function float(bytes) {
  // Bytes come in big-endian order, convert to little-endian for typed array
  const byteArray = new Uint8Array([bytes[3], bytes[2], bytes[1], bytes[0]]);
  const floatArray = new Float32Array(byteArray.buffer);

  return floatArray[0];
}

/**
 * IEEE 754 double precision (64-bit float) decoder
 * Simplified implementation using JavaScript's Float64Array
 * @private
 */
function double(bytes) {
  // Bytes come in big-endian order, convert to little-endian for typed array
  const byteArray = new Uint8Array([
    bytes[7], bytes[6], bytes[5], bytes[4],
    bytes[3], bytes[2], bytes[1], bytes[0],
  ]);
  const doubleArray = new Float64Array(byteArray.buffer);

  return doubleArray[0];
}

/**
 * 64-bit integer decoder (uses double for JavaScript compatibility)
 * @private
 */
function int64(bytes) {
  return double(bytes);
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
  unsigned,
};
