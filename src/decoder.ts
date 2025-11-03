export const NULL_INDICATOR = 0x00;
export const VARIANT_BASE = 0x01;

const floatBuffer = new Float32Array(1);
const floatBytes = new Uint8Array(floatBuffer.buffer);
const doubleBuffer = new Float64Array(1);
const doubleBytes = new Uint8Array(doubleBuffer.buffer);

function boolean(bytes, offset = 0) {
  return !!bytes[offset];
}

function int32(bytes, offset = 0) {
  return (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | (bytes[offset + 3]);
}

function uint8(bytes, offset = 0) {
  return bytes[offset];
}

function uint16(bytes, offset = 0) {
  return bytes[offset] << 8 | bytes[offset + 1];
}

function unsigned(bytes, offset = 0, length?) {
  const len = length !== undefined ? length : bytes.length - offset;
  if (len === 1) return uint8(bytes, offset);
  if (len === 2) return uint16(bytes, offset);
  return int32(bytes, offset);
}

function string(bytes, offset = 0, length?) {
  const len = length !== undefined ? length : bytes.length - offset;
  const chars = [];
  const end = offset + len;

  for (let i = offset; i < end;) {
    const byte1 = bytes[i++];

    if (byte1 < 0x80) {
      chars.push(byte1);
    }
    else if ((byte1 & 0xE0) === 0xC0) {
      const byte2 = bytes[i++];
      chars.push(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
    }
    else if ((byte1 & 0xF0) === 0xE0) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      chars.push(((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F));
    }
    else if ((byte1 & 0xF8) === 0xF0) {
      const byte2 = bytes[i++];
      const byte3 = bytes[i++];
      const byte4 = bytes[i++];
      let code = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) | ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);
      code -= 0x10000;
      chars.push(0xD800 | (code >> 10));
      chars.push(0xDC00 | (code & 0x3FF));
    }
  }

  return String.fromCharCode.apply(null, chars);
}

function uuid(bytes, offset = 0, length?) {
  const len = length !== undefined ? length : bytes.length - offset;
  if (len !== 16) {
    throw new Error('Invalid UUID byte length');
  }

  const hex = '0123456789abcdef';
  let result = '';

  for (let i = 0; i < 16; i++) {
    const byte = bytes[offset + i];
    result += hex[byte >> 4] + hex[byte & 0x0f];

    if (i === 3 || i === 5 || i === 7 || i === 9) {
      result += '-';
    }
  }

  return result;
}

function ipv4(bytes, offset = 0, length?) {
  const len = length !== undefined ? length : bytes.length - offset;
  if (len !== 4) {
    throw new Error('Invalid IPv4 byte length');
  }

  return `${bytes[offset]}.${bytes[offset + 1]}.${bytes[offset + 2]}.${bytes[offset + 3]}`;
}

function ipv6(bytes, offset = 0, length?) {
  const len = length !== undefined ? length : bytes.length - offset;
  if (len !== 16) {
    throw new Error('Invalid IPv6 byte length');
  }

  const groups = new Array(8);
  let longestZeroStart = -1;
  let longestZeroLength = 0;
  let currentZeroStart = -1;
  let currentZeroLength = 0;

  for (let i = 0; i < 8; i++) {
    const value = (bytes[offset + i * 2] << 8) | bytes[offset + i * 2 + 1];
    groups[i] = value;

    if (value === 0) {
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

  if (currentZeroLength > longestZeroLength) {
    longestZeroStart = currentZeroStart;
    longestZeroLength = currentZeroLength;
  }

  let result = '';

  if (longestZeroLength > 0) {
    for (let i = 0; i < longestZeroStart; i++) {
      if (i > 0) result += ':';
      result += groups[i].toString(16);
    }

    result += '::';

    const afterStart = longestZeroStart + longestZeroLength;
    for (let i = afterStart; i < 8; i++) {
      if (i > afterStart) result += ':';
      result += groups[i].toString(16);
    }
  }
  else {
    for (let i = 0; i < 8; i++) {
      if (i > 0) result += ':';
      result += groups[i].toString(16);
    }
  }

  return result;
}

function date(bytes, offset = 0, length?) {
  const len = length !== undefined ? length : bytes.length - offset;
  if (len !== 4) {
    throw new Error('Invalid date byte length');
  }

  const days = int32(bytes, offset);
  const epochMs = days * 86400000;
  const dateObj = new Date(epochMs);

  const year = dateObj.getUTCFullYear();
  const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function dateTime(bytes, offset = 0, length?) {
  const len = length !== undefined ? length : bytes.length - offset;
  if (len !== 8) {
    throw new Error('Invalid date-time byte length');
  }

  const ms = double(bytes, offset);
  const dateObj = new Date(ms);

  return dateObj.toISOString();
}

function binary(bytes, offset = 0, length?) {
  const len = length !== undefined ? length : bytes.length - offset;
  if (offset === 0 && len === bytes.length) {
    return Buffer.from(bytes).toString('base64');
  }
  return Buffer.from(bytes.subarray(offset, offset + len)).toString('base64');
}

function array(schema, bytes, offset = 0, length?) {
  const len = length !== undefined ? length : bytes.length - offset;
  const ret = [];
  const end = offset + len;

  for (let i = offset; i < end;) {
    if (schema.nullable || schema.variants) {
      const discriminator = bytes[i];
      i++;

      if (discriminator === 0x00) {
        ret.push(null);
        continue;
      }

      if (schema.variants) {
        const variantIndex = discriminator - 0x01;
        const variantField = schema.variants[variantIndex];

        if (!variantField) {
          throw new Error(`Invalid variant discriminator: ${discriminator}`);
        }

        const size = unsigned(bytes, i, variantField.count);
        i += variantField.count;

        ret.push(variantField.transformOut(bytes, i, size));
        i += size;
        continue;
      }
    }

    const size = unsigned(bytes, i, schema.count);
    i += schema.count;

    ret.push(schema.transformOut(bytes, i, size));
    i += size;
  }

  return ret;
}

function object(schema, bytes, offset = 0, length?) {
  if (offset === 0 && length === undefined) {
    return schema.read(bytes);
  }

  const len = length !== undefined ? length : bytes.length - offset;

  if (schema.readFromOffset) {
    return schema.readFromOffset(bytes, offset, len);
  }

  if (bytes.subarray) {
    return schema.read(bytes.subarray(offset, offset + len));
  }

  return schema.read(bytes.slice(offset, offset + len));
}

function float(bytes, offset = 0) {
  floatBytes[0] = bytes[offset + 3];
  floatBytes[1] = bytes[offset + 2];
  floatBytes[2] = bytes[offset + 1];
  floatBytes[3] = bytes[offset];

  return floatBuffer[0];
}

function double(bytes, offset = 0) {
  doubleBytes[0] = bytes[offset + 7];
  doubleBytes[1] = bytes[offset + 6];
  doubleBytes[2] = bytes[offset + 5];
  doubleBytes[3] = bytes[offset + 4];
  doubleBytes[4] = bytes[offset + 3];
  doubleBytes[5] = bytes[offset + 2];
  doubleBytes[6] = bytes[offset + 1];
  doubleBytes[7] = bytes[offset];

  return doubleBuffer[0];
}

function int64(bytes, offset = 0) {
  return double(bytes, offset);
}

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
