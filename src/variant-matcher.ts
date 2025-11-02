/** Shared variant matching utilities */

/* Type compatibility lookup for variant matching */
export const TYPE_COMPAT_MAP = {
  number: new Set(['int32', 'int64', 'float', 'double']),
  string: new Set(['string', 'uuid', 'ipv4', 'ipv6', 'date', 'date-time', 'binary']),
  boolean: new Set(['boolean']),
  array: new Set(['array']),
  object: new Set(['object']),
};

/**
 * Check if data matches a variant schema definition
 * @private
 */
export function matchesVariant(data, variant) {
  // Performance: Optimized type detection
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

  // Special handling for binary types (Buffer/Uint8Array)
  if (variant.type === 'binary' && (data instanceof Buffer || data instanceof Uint8Array)) {
    return true;
  }

  // Fast path: Use type compatibility map for quick lookup
  const compatibleTypes = TYPE_COMPAT_MAP[dataType];
  if (compatibleTypes && compatibleTypes.has(variant.type)) {
    // For objects, additional validation needed
    if (variant.type === 'object' && variant.schemaKeys && variant.schemaKeys.length > 0) {
      const schemaKeys = variant.schemaKeys;
      const dataKeys = Object.keys(data);

      // Check if data keys match schema keys
      let matchCount = 0;
      for (const key of schemaKeys) {
        if (data.hasOwnProperty(key)) {
          matchCount++;
        }
      }

      // Require at least one matching key and 50% overlap
      // This helps distinguish between different object variants
      return matchCount > 0 && matchCount >= Math.min(schemaKeys.length, dataKeys.length) * 0.5;
    }

    return true;
  }

  return false;
}
