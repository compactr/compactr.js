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

/**
 * UUID encoder - converts UUID string to 16 bytes
 * UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
 * Binary format: 16 bytes (128 bits)
 * Saves 56 bytes per UUID compared to string encoding
 * @private
 */
function uuid(val) {
  // Remove hyphens and validate format
  const hex = val.replace(/-/g, '');
  if (hex.length !== 32) {
    throw new Error('Invalid UUID format');
  }

  // Convert hex string to 16 bytes
  const bytes = [];
  for (let i = 0; i < 32; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }

  return bytes;
}

/**
 * IPv4 encoder - converts IPv4 string to 4 bytes
 * IPv4 format: "192.168.1.1" (max 15 chars = 30 bytes as string)
 * Binary format: 4 bytes
 * Saves up to 26 bytes
 * @private
 */
function ipv4(val) {
  const parts = val.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid IPv4 format');
  }

  const bytes = [];
  for (let i = 0; i < 4; i++) {
    const num = parseInt(parts[i], 10);
    if (isNaN(num) || num < 0 || num > 255) {
      throw new Error('Invalid IPv4 format');
    }
    bytes.push(num);
  }

  return bytes;
}

/**
 * IPv6 encoder - converts IPv6 string to 16 bytes
 * IPv6 format: "2001:0db8:85a3::8a2e:0370:7334" (max 39 chars = 78 bytes as string)
 * Binary format: 16 bytes
 * Saves up to 62 bytes
 * @private
 */
function ipv6(val) {
  // Expand :: notation
  let expanded = val;
  if (expanded.includes('::')) {
    const parts = expanded.split('::');
    const leftParts = parts[0] ? parts[0].split(':') : [];
    const rightParts = parts[1] ? parts[1].split(':') : [];
    const missingParts = 8 - leftParts.length - rightParts.length;
    const zeros = Array(missingParts).fill('0');
    expanded = [...leftParts, ...zeros, ...rightParts].join(':');
  }

  const parts = expanded.split(':');
  if (parts.length !== 8) {
    throw new Error('Invalid IPv6 format');
  }

  const bytes = [];
  for (let i = 0; i < 8; i++) {
    const num = parseInt(parts[i] || '0', 16);
    if (isNaN(num) || num < 0 || num > 0xffff) {
      throw new Error('Invalid IPv6 format');
    }
    bytes.push(num >> 8, num & 0xff);
  }

  return bytes;
}

/**
 * Date encoder - converts YYYY-MM-DD to 4 bytes (days since epoch)
 * Date format: "2025-10-28" (10 chars = 20 bytes as string)
 * Binary format: 4 bytes (signed int32, days since Jan 1, 1970)
 * Saves 16 bytes
 * @private
 */
function date(val) {
  const parsed = new Date(val + 'T00:00:00Z');
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date format');
  }

  // Calculate days since epoch
  const epochMs = parsed.getTime();
  const days = Math.floor(epochMs / 86400000);

  return int32(days);
}

/**
 * Date-time encoder - converts ISO 8601 to 8 bytes (milliseconds since epoch)
 * DateTime format: "2025-10-28T14:30:00Z" (20+ chars = 40+ bytes as string)
 * Binary format: 8 bytes (int64, milliseconds since Jan 1, 1970)
 * Saves 32+ bytes
 * @private
 */
function dateTime(val) {
  const parsed = new Date(val);
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date-time format');
  }

  // Store as milliseconds since epoch using double precision
  return double(parsed.getTime());
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
  uuid,
  ipv4,
  ipv6,
  date,
  'date-time': dateTime,
  array,
  object,
  getSize,
};
