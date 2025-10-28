/** Type Coersion utilities */

/* Methods ------------------------------------------------------------------- */

/** @private */

/** @private */
function int32(value) {
  return Number(value) & 0xffffffff;
}

/** @private */
function float(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? ret : 0;
}

/** @private */
function double(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? ret : 0;
}

/** @private */
function int64(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? Math.trunc(ret) : 0;
}

/** @private */
function string(value) {
  return '' + value;
}

/** @private */
function uuid(value) {
  // Validate and normalize UUID string
  const str = '' + value;
  const normalized = str.toLowerCase().replace(/-/g, '');
  if (!/^[0-9a-f]{32}$/.test(normalized)) {
    throw new Error('Invalid UUID format');
  }
  // Return in standard UUID format
  return [
    normalized.substr(0, 8),
    normalized.substr(8, 4),
    normalized.substr(12, 4),
    normalized.substr(16, 4),
    normalized.substr(20, 12),
  ].join('-');
}

/** @private */
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

/** @private */
function ipv6(value) {
  const str = '' + value;
  // Basic IPv6 validation - accepts both compressed and full formats
  if (!/^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(str) && !/^::$/.test(str)) {
    throw new Error('Invalid IPv6 format');
  }
  return str.toLowerCase();
}

/** @private */
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

/** @private */
function dateTime(value) {
  const str = '' + value;
  const parsed = new Date(str);
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date-time format');
  }
  return parsed.toISOString();
}

/** @private */
function boolean(value) {
  return !!value;
}

/** @private */
function object(value) {
  return (value.constructor === Object) ? value : {};
}

/** @private */
function array(value) {
  return (value.concat !== undefined) ? value : [value];
}

/* Exports ------------------------------------------------------------------- */

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
  boolean,
  array,
  object,
};
