function int32(value) {
  return Number(value) & 0xffffffff;
}

function float(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? ret : 0;
}

function double(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? ret : 0;
}

function int64(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? Math.trunc(ret) : 0;
}

function string(value) {
  return '' + value;
}

function uuid(value) {
  const str = '' + value;
  const normalized = str.toLowerCase().replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/.test(normalized)) {
    throw new Error('Invalid UUID format');
  }
  return [
    normalized.substr(0, 8),
    normalized.substr(8, 4),
    normalized.substr(12, 4),
    normalized.substr(16, 4),
    normalized.substr(20, 12),
  ].join('-');
}

function ipv4(value) {
  const str = '' + value;
  const parts = str.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid IPv4 format');
  }
  for (let i = 0; i < 4; i++) {
    const num = parseInt(parts[i], 10);
    if (isNaN(num) || num < 0 || num > 255) {
      throw new Error('Invalid IPv4 format');
    }
  }
  return str;
}

function ipv6(value) {
  const str = '' + value;
  if (!/^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(str) && !/^::$/.test(str)) {
    throw new Error('Invalid IPv6 format');
  }
  return str.toLowerCase();
}

function date(value) {
  const str = '' + value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    throw new Error('Invalid date format, expected YYYY-MM-DD');
  }
  const parsed = new Date(str + 'T00:00:00Z');
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date format');
  }
  return str;
}

function dateTime(value) {
  const str = '' + value;
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date-time format');
  }
  return parsed.toISOString();
}

function binary(value) {
  if (Buffer.isBuffer(value)) {
    return value.toString('base64');
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('base64');
  }

  if (typeof value === 'string') {
    const buffer = Buffer.from(value, 'base64');
    return buffer.toString('base64');
  }

  throw new Error('Invalid binary format: expected Buffer, Uint8Array, or base64 string');
}

function boolean(value) {
  return !!value;
}

function object(value) {
  return (value.constructor === Object) ? value : {};
}

function array(value) {
  return (value.concat !== undefined) ? value : [value];
}

export default {
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
  boolean,
  array,
  object,
};
