export const TYPE_COMPAT_MAP = {
  number: new Set(['int32', 'int64', 'float', 'double']),
  string: new Set(['string', 'uuid', 'ipv4', 'ipv6', 'date', 'date-time', 'binary']),
  boolean: new Set(['boolean']),
  array: new Set(['array']),
  object: new Set(['object']),
};

export function matchesVariant(data, variant) {
  let dataType;
  if (data === null) {
    dataType = 'null';
  }
  else if (Array.isArray(data)) {
    dataType = 'array';
  }
  else {
    dataType = typeof data;
  }

  if (variant.type === 'binary' && (data instanceof Buffer || data instanceof Uint8Array)) {
    return true;
  }

  const compatibleTypes = TYPE_COMPAT_MAP[dataType];
  if (compatibleTypes && compatibleTypes.has(variant.type)) {
    if (variant.type === 'object' && variant.schemaKeys && variant.schemaKeys.length > 0) {
      const schemaKeys = variant.schemaKeys;
      const dataKeys = Object.keys(data);

      let matchCount = 0;
      for (const key of schemaKeys) {
        if (data.hasOwnProperty(key)) {
          matchCount++;
        }
      }

      return matchCount > 0 && matchCount >= Math.min(schemaKeys.length, dataKeys.length) * 0.5;
    }

    return true;
  }

  return false;
}
