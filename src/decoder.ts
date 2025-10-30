/** Decoding utilities */

/* Local variables ----------------------------------------------------------- */

const fromChar = String.fromCharCode;

// Discriminator byte for nullable/oneOf/anyOf fields
export const NULL_INDICATOR = 0x00; // Field is null
export const VARIANT_BASE = 0x01; // First variant (or present for simple nullable)

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

/**
 * UUID decoder - converts 16 bytes to UUID string
 * Binary format: 16 bytes (128 bits)
 * UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 chars)
 * @private
 */
function uuid(bytes) {
  if (bytes.length !== 16) {
    throw new Error('Invalid UUID byte length');
  }

  // Convert bytes to hex string
  const hex = [];
  for (let i = 0; i < 16; i++) {
    const byte = bytes[i].toString(16).padStart(2, '0');
    hex.push(byte);
  }

  // Insert hyphens at proper positions: 8-4-4-4-12
  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}

/**
 * IPv4 decoder - converts 4 bytes to IPv4 string
 * Binary format: 4 bytes
 * IPv4 format: "192.168.1.1"
 * @private
 */
function ipv4(bytes) {
  if (bytes.length !== 4) {
    throw new Error('Invalid IPv4 byte length');
  }

  return bytes.join('.');
}

/**
 * IPv6 decoder - converts 16 bytes to IPv6 string
 * Binary format: 16 bytes
 * IPv6 format: "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
 * @private
 */
function ipv6(bytes) {
  if (bytes.length !== 16) {
    throw new Error('Invalid IPv6 byte length');
  }

  const parts = [];
  for (let i = 0; i < 16; i += 2) {
    const value = (bytes[i] << 8) | bytes[i + 1];
    parts.push(value.toString(16).padStart(4, '0'));
  }

  // Find longest sequence of consecutive '0000' groups for compression
  let longestZeroStart = -1;
  let longestZeroLength = 0;
  let currentZeroStart = -1;
  let currentZeroLength = 0;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '0000') {
      if (currentZeroStart === -1) {
        currentZeroStart = i;
        currentZeroLength = 1;
      }
      else {
        currentZeroLength++;
      }
    }
    else {
      if (currentZeroLength > longestZeroLength) {
        longestZeroStart = currentZeroStart;
        longestZeroLength = currentZeroLength;
      }
      currentZeroStart = -1;
      currentZeroLength = 0;
    }
  }

  // Check final sequence
  if (currentZeroLength > longestZeroLength) {
    longestZeroStart = currentZeroStart;
    longestZeroLength = currentZeroLength;
  }

  // Remove leading zeros from each part (except if it's all zeros)
  const strippedParts = parts.map((p) => {
    const stripped = p.replace(/^0+/, '');
    return stripped === '' ? '0' : stripped;
  });

  // Apply compression if we found at least one zero group
  if (longestZeroLength > 0) {
    const before = strippedParts.slice(0, longestZeroStart);
    const after = strippedParts.slice(longestZeroStart + longestZeroLength);

    // Build result with :: compression
    let result = '';
    if (before.length > 0) {
      result = before.join(':');
    }
    result += '::';
    if (after.length > 0) {
      result += after.join(':');
    }

    return result;
  }

  // No zero sequences, return with leading zeros stripped
  return strippedParts.join(':');
}

/**
 * Date decoder - converts 4 bytes (days since epoch) to YYYY-MM-DD
 * Binary format: 4 bytes (signed int32, days since Jan 1, 1970)
 * Date format: "2025-10-28"
 * @private
 */
function date(bytes) {
  if (bytes.length !== 4) {
    throw new Error('Invalid date byte length');
  }

  const days = int32(bytes);
  const epochMs = days * 86400000;
  const dateObj = new Date(epochMs);

  // Format as YYYY-MM-DD
  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Date-time decoder - converts 8 bytes to ISO 8601 string
 * Binary format: 8 bytes (int64, milliseconds since Jan 1, 1970)
 * DateTime format: "2025-10-28T14:30:00.000Z"
 * @private
 */
function dateTime(bytes) {
  if (bytes.length !== 8) {
    throw new Error('Invalid date-time byte length');
  }

  const ms = double(bytes);
  const dateObj = new Date(ms);

  return dateObj.toISOString();
}

/**
 * Binary decoder - converts raw bytes to base64 string
 * Binary format: raw bytes
 * Base64 format: "SGVsbG8gV29ybGQ="
 * @private
 */
function binary(bytes) {
  const buffer = Buffer.from(bytes);
  return buffer.toString('base64');
}

/** @private */
function array(schema, bytes) {
  const ret = [];

  for (let i = 0; i < bytes.length;) {
    // Handle nullable or variant array items
    if (schema.nullable || schema.variants) {
      const discriminator = bytes[i];
      i++;

      // Handle null value
      if (discriminator === 0x00) {
        ret.push(null);
        continue;
      }

      // Handle variant items
      if (schema.variants) {
        const variantIndex = discriminator - 0x01;
        const variantField = schema.variants[variantIndex];

        if (!variantField) {
          throw new Error(`Invalid variant discriminator: ${discriminator}`);
        }

        const size = unsigned(bytes.slice(i, i + variantField.count));
        i += variantField.count;
        ret.push(variantField.transformOut(bytes.slice(i, i + size)));
        i += size;
        continue;
      }

      // For nullable non-variant items, discriminator 0x01 means value is present
      // Continue to decode the value normally below
    }

    // Handle regular array items
    const size = unsigned(bytes.slice(i, i + schema.count));
    i += schema.count;
    ret.push(schema.transformOut(bytes.slice(i, i + size)));
    i += size;
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
  uuid,
  ipv4,
  ipv6,
  date,
  'date-time': dateTime,
  binary,
  array,
  object,
  unsigned,
};
