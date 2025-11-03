import { writeFieldWithSize, processVariantWrite } from './buffer-utils';

export const NULL_INDICATOR = 0x00;
export const VARIANT_BASE = 0x01;

const floatBuffer = new Float32Array(1);
const floatBytes = new Uint8Array(floatBuffer.buffer);
const doubleBuffer = new Float64Array(1);
const doubleBytes = new Uint8Array(doubleBuffer.buffer);

function boolean(val, buffer, pos) {
  buffer[pos] = val ? 1 : 0;
  return pos + 1;
}

function int32(val, buffer, pos) {
  if (val < 0) val = 0xffffffff + val + 1;
  buffer[pos] = val >> 24;
  buffer[pos + 1] = val >> 16;
  buffer[pos + 2] = val >> 8;
  buffer[pos + 3] = val & 0xff;
  return pos + 4;
}

function string(val, buffer, pos) {
  const bytesWritten = Buffer.prototype.write.call(buffer, val, pos, undefined, 'utf8');
  return pos + bytesWritten;
}

function hexCharToNum(char) {
  const code = char.charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 48; // 0-9
  if (code >= 97 && code <= 102) return code - 87; // a-f
  if (code >= 65 && code <= 70) return code - 55; // A-F
  throw new Error('Invalid hex character: ' + char);
}

function uuid(val, buffer, pos) {
  if (val.length !== 36) {
    throw new Error('Invalid UUID format: expected 36 characters');
  }

  let byteIdx = pos;

  for (let i = 0; i < val.length; i++) {
    const char = val[i];
    if (char === '-') continue;

    const high = hexCharToNum(val[i]);
    const low = hexCharToNum(val[i + 1]);
    buffer[byteIdx++] = (high << 4) | low;
    i++;
  }

  if (byteIdx - pos !== 16) {
    throw new Error('Invalid UUID format: incorrect number of hex digits');
  }

  return byteIdx;
}

function ipv4(val, buffer, pos) {
  const parts = val.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid IPv4 format');
  }

  for (let i = 0; i < 4; i++) {
    const num = parseInt(parts[i], 10);
    if (isNaN(num) || num < 0 || num > 255) {
      throw new Error('Invalid IPv4 format');
    }
    buffer[pos + i] = num;
  }

  return pos + 4;
}

function ipv6(val, buffer, pos) {
  let byteIdx = 0;

  const doubleColonPos = val.indexOf('::');

  if (doubleColonPos !== -1) {
    let i = 0;
    while (i < doubleColonPos) {
      let hexStr = '';
      while (i < doubleColonPos && val[i] !== ':') {
        hexStr += val[i];
        i++;
      }
      if (hexStr) {
        const num = parseInt(hexStr, 16);
        if (isNaN(num) || num < 0 || num > 0xffff) {
          throw new Error('Invalid IPv6 format');
        }
        buffer[pos + byteIdx++] = num >> 8;
        buffer[pos + byteIdx++] = num & 0xff;
      }
      i++;
    }

    const leftGroups = byteIdx / 2;

    i = doubleColonPos + 2;
    const rightStart = [];
    while (i < val.length) {
      let hexStr = '';
      while (i < val.length && val[i] !== ':') {
        hexStr += val[i];
        i++;
      }
      if (hexStr) {
        const num = parseInt(hexStr, 16);
        if (isNaN(num) || num < 0 || num > 0xffff) {
          throw new Error('Invalid IPv6 format');
        }
        rightStart.push(num >> 8, num & 0xff);
      }
      i++;
    }

    const rightGroups = rightStart.length / 2;
    const zeroGroups = 8 - leftGroups - rightGroups;

    for (let z = 0; z < zeroGroups * 2; z++) {
      buffer[pos + byteIdx++] = 0;
    }

    for (let r = 0; r < rightStart.length; r++) {
      buffer[pos + byteIdx++] = rightStart[r];
    }
  }
  else {
    let i = 0;
    let groupCount = 0;
    while (i < val.length) {
      let hexStr = '';
      while (i < val.length && val[i] !== ':') {
        hexStr += val[i];
        i++;
      }
      if (hexStr) {
        const num = parseInt(hexStr || '0', 16);
        if (isNaN(num) || num < 0 || num > 0xffff) {
          throw new Error('Invalid IPv6 format');
        }
        buffer[pos + byteIdx++] = num >> 8;
        buffer[pos + byteIdx++] = num & 0xff;
        groupCount++;
      }
      i++;
    }

    if (groupCount !== 8) {
      throw new Error('Invalid IPv6 format: expected 8 groups');
    }
  }

  if (byteIdx !== 16) {
    throw new Error('Invalid IPv6 format: incorrect byte count');
  }

  return pos + 16;
}

function date(val, buffer, pos) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
  if (!match) {
    throw new Error('Invalid date format, expected YYYY-MM-DD');
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  buffer[pos] = year >> 8;
  buffer[pos + 1] = year & 0xff;
  buffer[pos + 2] = month;
  buffer[pos + 3] = day;
  return pos + 4;
}

function dateTime(val, buffer, pos) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z?$/.exec(val);
  if (!match) {
    throw new Error('Invalid date-time format, expected YYYY-MM-DDTHH:mm:ss.sssZ');
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = parseInt(match[6], 10);
  const millisecond = match[7] ? parseInt(match[7], 10) : 0;

  buffer[pos] = year >> 8;
  buffer[pos + 1] = year & 0xff;
  buffer[pos + 2] = month;
  buffer[pos + 3] = day;
  buffer[pos + 4] = hour;
  buffer[pos + 5] = minute;
  buffer[pos + 6] = second;
  buffer[pos + 7] = millisecond >> 8;
  buffer[pos + 8] = millisecond & 0xff;
  return pos + 9;
}

function binary(val, buffer, pos) {
  if (Buffer.isBuffer(val)) {
    val.copy(buffer, pos);
    return pos + val.length;
  }

  if (val instanceof Uint8Array) {
    buffer.set(val, pos);
    return pos + val.length;
  }

  if (typeof val === 'string') {
    const bytesWritten = Buffer.from(val, 'base64').copy(buffer, pos);
    return pos + bytesWritten;
  }

  throw new Error('Binary format requires Buffer, Uint8Array, or base64 string');
}

function array(schema, val, buffer, pos) {
  for (let i = 0; i < val.length; i++) {
    const item = val[i];

    if (schema.nullable && item === null) {
      buffer[pos++] = NULL_INDICATOR;
      continue;
    }

    if (schema.variants) {
      pos = processVariantWrite(buffer, pos, item, schema, 'Array item');
      continue;
    }

    if (schema.nullable) {
      buffer[pos++] = VARIANT_BASE;
    }

    pos = writeFieldWithSize(buffer, pos, item, schema);
  }

  return pos;
}

function object(schema, val, buffer, pos) {
  return schema.writeToBuffer(val, buffer, pos);
}

function float(val, buffer, pos) {
  floatBuffer[0] = val;

  buffer[pos] = floatBytes[3];
  buffer[pos + 1] = floatBytes[2];
  buffer[pos + 2] = floatBytes[1];
  buffer[pos + 3] = floatBytes[0];
  return pos + 4;
}

function double(val, buffer, pos) {
  doubleBuffer[0] = val;

  buffer[pos] = doubleBytes[7];
  buffer[pos + 1] = doubleBytes[6];
  buffer[pos + 2] = doubleBytes[5];
  buffer[pos + 3] = doubleBytes[4];
  buffer[pos + 4] = doubleBytes[3];
  buffer[pos + 5] = doubleBytes[2];
  buffer[pos + 6] = doubleBytes[1];
  buffer[pos + 7] = doubleBytes[0];
  return pos + 8;
}

function int64(val, buffer, pos) {
  return double(val, buffer, pos);
}

function getSize(count, byteLength) {
  if (count === 1) {
    return Buffer.from([byteLength & 0xff]);
  }
  if (count === 2) {
    return Buffer.from([byteLength >> 8, byteLength & 0xff]);
  }
  if (count === 4) {
    return Buffer.from([
      byteLength >> 24,
      (byteLength >> 16) & 0xff,
      (byteLength >> 8) & 0xff,
      byteLength & 0xff,
    ]);
  }
  return Buffer.from([]);
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
  getSize,
};
