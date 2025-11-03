export function canUseCodegen(schema) {
  // Check which fields can use codegen
  const result = {
    canGenerate: false,
    fields: {},
  };

  for (const key in schema) {
    const field = schema[key];

    // Mark field as codegen-compatible if it's a simple type
    if (!field.variants && !field.oneOf && !field.anyOf
      && field.type !== 'array' && field.type !== 'object') {
      result.fields[key] = true;
      result.canGenerate = true; // At least one field is codegen-compatible
    }
    else {
      result.fields[key] = false;
    }
  }

  return result;
}

export function generateWriteFunction(scope, codegenInfo) {
  const fields = scope.items.map(key => ({
    key,
    field: scope.indices[key],
    canCodegen: codegenInfo.fields[key] || false,
  }));

  const lines = [];

  lines.push('return function(data, writeFieldWithSize, processVariantWrite) {');
  lines.push('  let pos = 0;');
  lines.push('  let size = 1;');
  lines.push('');
  lines.push('  // Pre-compiled regexes (performance optimization)');
  lines.push('  const dateRegex = /^(\\d{4})-(\\d{2})-(\\d{2})$/;');
  lines.push('  const dateTimeRegex = /^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})(?:\\.(\\d{3}))?Z?$/;');

  // Declare all length variables at the top
  for (const { key, field, canCodegen } of fields) {
    if (canCodegen && field.type === 'string' && !field.size) {
      lines.push(`  let ${key}_len = 0;`);
    }
  }

  lines.push('');

  lines.push('  // Calculate size');
  for (const { key, field, canCodegen } of fields) {
    if (canCodegen && field.nullable) {
      // Nullable fields: count them even when null
      lines.push(`  if (data.${key} !== undefined) {`);
      lines.push(`    size += 2;`); // field index + null indicator or variant base
      lines.push(`    if (data.${key} !== null) {`);

      if (field.size) {
        // Fixed size fields also need size prefix
        lines.push(`      size += ${field.count || 1} + ${field.size};`);
      }
      else {
        lines.push(generateSizeCalc(key, field));
      }

      lines.push(`    }`);
      lines.push(`  }`);
    }
    else if (canCodegen) {
      // Non-nullable codegen fields: only count when present
      lines.push(`  if (data.${key} !== null && data.${key} !== undefined) {`);
      lines.push(`    size += 1;`); // field index only

      if (field.size) {
        // Fixed size fields also need size prefix
        lines.push(`    size += ${field.count || 1} + ${field.size};`);
      }
      else {
        lines.push(generateSizeCalc(key, field));
      }

      lines.push('  }');
    }
    else {
      // Fall back to runtime for complex fields - use estimates like original estimateBufferSize
      lines.push(`  // Field ${key}: runtime estimate`);

      // Estimate sizes based on field type (from writer.ts estimateBufferSize)
      let estimate = 16; // default estimate
      if (field.type === 'string') estimate = 32;
      else if (field.type === 'array') estimate = 64;
      else if (field.type === 'object') estimate = 128;

      if (field.nullable) {
        lines.push(`  if (data.${key} !== undefined) {`);
        lines.push(`    size += 2;`); // field index + nullable indicator
        lines.push(`    if (data.${key} !== null) {`);
        lines.push(`      size += ${field.count || 1};`); // size prefix
        lines.push(`      size += ${estimate};`); // estimated data size
        lines.push(`    }`);
        lines.push(`  }`);
      }
      else {
        lines.push(`  if (data.${key} !== null && data.${key} !== undefined) {`);
        lines.push(`    size += 1 + ${field.count || 1};`); // field index + size prefix
        lines.push(`    size += ${estimate};`); // estimated data size
        lines.push('  }');
      }
    }
  }

  lines.push('');
  lines.push('  // Add safety margin for runtime fields (like estimateBufferSize)');
  lines.push('  size = Math.max(Math.floor(size * 1.5), 256);');
  lines.push('  const buf = Buffer.allocUnsafe(size);');
  lines.push('');

  lines.push('  // Field count');
  lines.push('  let fieldCount = 0;');
  for (const { key, field } of fields) {
    if (field.nullable) {
      // Nullable fields: count even when null (but not undefined)
      lines.push(`  if (data.${key} !== undefined) fieldCount++;`);
    }
    else {
      // Non-nullable fields: only count when present
      lines.push(`  if (data.${key} !== null && data.${key} !== undefined) fieldCount++;`);
    }
  }
  lines.push('  buf[pos++] = fieldCount;');
  lines.push('');

  lines.push('  // Write fields');
  for (const { key, field, canCodegen } of fields) {
    if (canCodegen && field.nullable) {
      // Codegen nullable field: handle both null and non-null values
      lines.push(`  if (data.${key} !== undefined) {`);
      lines.push(`    buf[pos++] = ${field.index};`);
      lines.push(`    if (data.${key} === null) {`);
      lines.push(`      buf[pos++] = 0x00;`); // NULL_INDICATOR
      lines.push(`    } else {`);
      lines.push(`      buf[pos++] = 0x01;`); // VARIANT_BASE
      lines.push(generateFieldWrite(key, field).split('\n').map(l => '  ' + l).join('\n'));
      lines.push(`    }`);
      lines.push(`  }`);
    }
    else if (canCodegen) {
      // Codegen non-nullable field: skip if null/undefined
      lines.push(`  if (data.${key} !== null && data.${key} !== undefined) {`);
      lines.push(`    buf[pos++] = ${field.index};`);
      lines.push(generateFieldWrite(key, field));
      lines.push('  }');
    }
    else {
      // Runtime field: use writeFieldWithSize
      lines.push(`  // Field ${key}: runtime write`);
      if (field.nullable) {
        lines.push(`  if (data.${key} !== undefined) {`);
        lines.push(`    buf[pos++] = ${field.index};`);
        lines.push(`    if (data.${key} === null) {`);
        lines.push(`      buf[pos++] = 0x00;`);
        lines.push(`    } else {`);
        if (field.variants) {
          lines.push(`      pos = processVariantWrite(buf, pos, data.${key}, this.scope.indices['${key}'], 'Field: ${key}');`);
        }
        else {
          lines.push(`      buf[pos++] = 0x01;`);
          lines.push(`      pos = writeFieldWithSize(buf, pos, data.${key}, this.scope.indices['${key}']);`);
        }
        lines.push(`    }`);
        lines.push(`  }`);
      }
      else {
        lines.push(`  if (data.${key} !== null && data.${key} !== undefined) {`);
        lines.push(`    buf[pos++] = ${field.index};`);
        if (field.variants) {
          lines.push(`    pos = processVariantWrite(buf, pos, data.${key}, this.scope.indices['${key}'], 'Field: ${key}');`);
        }
        else {
          lines.push(`    pos = writeFieldWithSize(buf, pos, data.${key}, this.scope.indices['${key}']);`);
        }
        lines.push('  }');
      }
    }
  }

  lines.push('');
  lines.push('  // Return only the used portion of the buffer');
  lines.push('  return Buffer.from(buf.subarray(0, pos));');
  lines.push('}');

  const code = lines.join('\n');

  try {
    const fn = new Function(code)();
    return fn;
  }
  catch (e) {
    console.error('Codegen compilation error:', e.message);
    console.error('Generated code:');
    code.split('\n').forEach((line, i) => console.error(`${String(i + 1).padStart(3, ' ')}: ${line}`));
    return null;
  }
}

function generateSizeCalc(varName, field) {
  const val = `data.${varName}`;

  if (field.type === 'string') {
    return `
    ${varName}_len = 0;
    for (let i = 0; i < ${val}.length; i++) {
      const c = ${val}.charCodeAt(i);
      if (c < 128) ${varName}_len++;
      else if (c < 2048) ${varName}_len += 2;
      else if ((c & 0xFC00) === 0xD800 && i + 1 < ${val}.length && (${val}.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
        i++;
        ${varName}_len += 4;
      }
      else ${varName}_len += 3;
    }
    size += 1 + ${varName}_len;`;
  }

  if (field.type === 'binary') {
    return `
    if (Buffer.isBuffer(${val})) size += 4 + ${val}.length;
    else if (${val} instanceof Uint8Array) size += 4 + ${val}.length;
    else if (typeof ${val} === 'string') size += 4 + Buffer.byteLength(${val}, 'base64');`;
  }

  return '';
}

function writeSizePrefix(size, count) {
  if (count === 1) {
    return [`    buf[pos++] = ${size};`];
  }
  if (count === 2) {
    return [
      `    buf[pos++] = ${size} >> 8;`,
      `    buf[pos++] = ${size} & 0xff;`,
    ];
  }
  if (count === 4) {
    return [
      `    buf[pos++] = ${size} >> 24;`,
      `    buf[pos++] = (${size} >> 16) & 0xff;`,
      `    buf[pos++] = (${size} >> 8) & 0xff;`,
      `    buf[pos++] = ${size} & 0xff;`,
    ];
  }
  return [];
}

function generateFieldWrite(varName, field) {
  const val = `data.${varName}`;
  const lines = [];

  if (field.type === 'boolean') {
    lines.push(...writeSizePrefix(1, field.count || 1));
    lines.push(`    buf[pos++] = ${val} ? 1 : 0;`);
  }
  else if (field.type === 'int32') {
    lines.push(...writeSizePrefix(4, field.count || 1));
    lines.push(`    let val = ${val};`);
    lines.push(`    if (val < 0) val = 0xffffffff + val + 1;`);
    lines.push(`    buf[pos++] = val >> 24;`);
    lines.push(`    buf[pos++] = val >> 16;`);
    lines.push(`    buf[pos++] = val >> 8;`);
    lines.push(`    buf[pos++] = val & 0xff;`);
  }
  else if (field.type === 'int64') {
    lines.push(...writeSizePrefix(8, field.count || 1));
    lines.push(`    const dblBuf = new Float64Array([${val}]);`);
    lines.push(`    const dblBytes = new Uint8Array(dblBuf.buffer);`);
    lines.push(`    buf[pos++] = dblBytes[7];`);
    lines.push(`    buf[pos++] = dblBytes[6];`);
    lines.push(`    buf[pos++] = dblBytes[5];`);
    lines.push(`    buf[pos++] = dblBytes[4];`);
    lines.push(`    buf[pos++] = dblBytes[3];`);
    lines.push(`    buf[pos++] = dblBytes[2];`);
    lines.push(`    buf[pos++] = dblBytes[1];`);
    lines.push(`    buf[pos++] = dblBytes[0];`);
  }
  else if (field.type === 'float') {
    lines.push(...writeSizePrefix(4, field.count || 1));
    lines.push(`    const fltBuf = new Float32Array([${val}]);`);
    lines.push(`    const fltBytes = new Uint8Array(fltBuf.buffer);`);
    lines.push(`    buf[pos++] = fltBytes[3];`);
    lines.push(`    buf[pos++] = fltBytes[2];`);
    lines.push(`    buf[pos++] = fltBytes[1];`);
    lines.push(`    buf[pos++] = fltBytes[0];`);
  }
  else if (field.type === 'double') {
    lines.push(...writeSizePrefix(8, field.count || 1));
    lines.push(`    const dblBuf = new Float64Array([${val}]);`);
    lines.push(`    const dblBytes = new Uint8Array(dblBuf.buffer);`);
    lines.push(`    buf[pos++] = dblBytes[7];`);
    lines.push(`    buf[pos++] = dblBytes[6];`);
    lines.push(`    buf[pos++] = dblBytes[5];`);
    lines.push(`    buf[pos++] = dblBytes[4];`);
    lines.push(`    buf[pos++] = dblBytes[3];`);
    lines.push(`    buf[pos++] = dblBytes[2];`);
    lines.push(`    buf[pos++] = dblBytes[1];`);
    lines.push(`    buf[pos++] = dblBytes[0];`);
  }
  else if (field.type === 'string') {
    lines.push(`    buf[pos++] = ${varName}_len;`);
    lines.push(`    pos += buf.write(${val}, pos, undefined, 'utf8');`);
  }
  else if (field.type === 'uuid') {
    lines.push(...writeSizePrefix(16, field.count || 1));
    lines.push(`    let byteIdx = pos;`);
    lines.push(`    for (let i = 0; i < ${val}.length; i++) {`);
    lines.push(`      const char = ${val}[i];`);
    lines.push(`      if (char === '-') continue;`);
    lines.push(`      const code1 = ${val}.charCodeAt(i);`);
    lines.push(`      const high = code1 >= 48 && code1 <= 57 ? code1 - 48 : code1 >= 97 && code1 <= 102 ? code1 - 87 : code1 - 55;`);
    lines.push(`      const code2 = ${val}.charCodeAt(i + 1);`);
    lines.push(`      const low = code2 >= 48 && code2 <= 57 ? code2 - 48 : code2 >= 97 && code2 <= 102 ? code2 - 87 : code2 - 55;`);
    lines.push(`      buf[byteIdx++] = (high << 4) | low;`);
    lines.push(`      i++;`);
    lines.push(`    }`);
    lines.push(`    pos = byteIdx;`);
  }
  else if (field.type === 'ipv4') {
    lines.push(...writeSizePrefix(4, field.count || 1));
    lines.push(`    const parts = ${val}.split('.');`);
    lines.push(`    for (let i = 0; i < 4; i++) {`);
    lines.push(`      buf[pos++] = parseInt(parts[i], 10);`);
    lines.push(`    }`);
  }
  else if (field.type === 'ipv6') {
    lines.push(...writeSizePrefix(16, field.count || 1));
    lines.push(`    let byteIdx = 0;`);
    lines.push(`    const doubleColonPos = ${val}.indexOf('::');`);
    lines.push(`    `);
    lines.push(`    if (doubleColonPos !== -1) {`);
    lines.push(`      let i = 0;`);
    lines.push(`      while (i < doubleColonPos) {`);
    lines.push(`        let hexStr = '';`);
    lines.push(`        while (i < doubleColonPos && ${val}[i] !== ':') {`);
    lines.push(`          hexStr += ${val}[i];`);
    lines.push(`          i++;`);
    lines.push(`        }`);
    lines.push(`        if (hexStr) {`);
    lines.push(`          const num = parseInt(hexStr, 16);`);
    lines.push(`          buf[pos + byteIdx++] = num >> 8;`);
    lines.push(`          buf[pos + byteIdx++] = num & 0xff;`);
    lines.push(`        }`);
    lines.push(`        i++;`);
    lines.push(`      }`);
    lines.push(`      `);
    lines.push(`      const leftGroups = byteIdx / 2;`);
    lines.push(`      `);
    lines.push(`      i = doubleColonPos + 2;`);
    lines.push(`      const rightStart = [];`);
    lines.push(`      while (i < ${val}.length) {`);
    lines.push(`        let hexStr = '';`);
    lines.push(`        while (i < ${val}.length && ${val}[i] !== ':') {`);
    lines.push(`          hexStr += ${val}[i];`);
    lines.push(`          i++;`);
    lines.push(`        }`);
    lines.push(`        if (hexStr) {`);
    lines.push(`          const num = parseInt(hexStr, 16);`);
    lines.push(`          rightStart.push(num >> 8, num & 0xff);`);
    lines.push(`        }`);
    lines.push(`        i++;`);
    lines.push(`      }`);
    lines.push(`      `);
    lines.push(`      const rightGroups = rightStart.length / 2;`);
    lines.push(`      const zeroGroups = 8 - leftGroups - rightGroups;`);
    lines.push(`      `);
    lines.push(`      for (let z = 0; z < zeroGroups * 2; z++) {`);
    lines.push(`        buf[pos + byteIdx++] = 0;`);
    lines.push(`      }`);
    lines.push(`      `);
    lines.push(`      for (let r = 0; r < rightStart.length; r++) {`);
    lines.push(`        buf[pos + byteIdx++] = rightStart[r];`);
    lines.push(`      }`);
    lines.push(`    } else {`);
    lines.push(`      let i = 0;`);
    lines.push(`      let groupCount = 0;`);
    lines.push(`      while (i < ${val}.length) {`);
    lines.push(`        let hexStr = '';`);
    lines.push(`        while (i < ${val}.length && ${val}[i] !== ':') {`);
    lines.push(`          hexStr += ${val}[i];`);
    lines.push(`          i++;`);
    lines.push(`        }`);
    lines.push(`        if (hexStr) {`);
    lines.push(`          const num = parseInt(hexStr || '0', 16);`);
    lines.push(`          buf[pos + byteIdx++] = num >> 8;`);
    lines.push(`          buf[pos + byteIdx++] = num & 0xff;`);
    lines.push(`          groupCount++;`);
    lines.push(`        }`);
    lines.push(`        i++;`);
    lines.push(`      }`);
    lines.push(`    }`);
    lines.push(`    pos += 16;`);
  }
  else if (field.type === 'date') {
    lines.push(...writeSizePrefix(4, field.count || 1));
    lines.push(`    const match = dateRegex.exec(${val});`);
    lines.push(`    if (!match) throw new Error('Invalid date format for field ${varName}: ' + ${val});`);
    lines.push(`    const year = parseInt(match[1], 10);`);
    lines.push(`    const month = parseInt(match[2], 10);`);
    lines.push(`    const day = parseInt(match[3], 10);`);
    lines.push(`    buf[pos++] = year >> 8;`);
    lines.push(`    buf[pos++] = year & 0xff;`);
    lines.push(`    buf[pos++] = month;`);
    lines.push(`    buf[pos++] = day;`);
  }
  else if (field.type === 'date-time') {
    lines.push(...writeSizePrefix(9, field.count || 1));
    lines.push(`    const match = dateTimeRegex.exec(${val});`);
    lines.push(`    if (!match) throw new Error('Invalid date-time format for field ${varName}: ' + ${val});`);
    lines.push(`    const year = parseInt(match[1], 10);`);
    lines.push(`    const month = parseInt(match[2], 10);`);
    lines.push(`    const day = parseInt(match[3], 10);`);
    lines.push(`    const hour = parseInt(match[4], 10);`);
    lines.push(`    const minute = parseInt(match[5], 10);`);
    lines.push(`    const second = parseInt(match[6], 10);`);
    lines.push(`    const millisecond = match[7] ? parseInt(match[7], 10) : 0;`);
    lines.push(`    buf[pos++] = year >> 8;`);
    lines.push(`    buf[pos++] = year & 0xff;`);
    lines.push(`    buf[pos++] = month;`);
    lines.push(`    buf[pos++] = day;`);
    lines.push(`    buf[pos++] = hour;`);
    lines.push(`    buf[pos++] = minute;`);
    lines.push(`    buf[pos++] = second;`);
    lines.push(`    buf[pos++] = millisecond >> 8;`);
    lines.push(`    buf[pos++] = millisecond & 0xff;`);
  }
  else if (field.type === 'binary') {
    lines.push(`    if (Buffer.isBuffer(${val})) {`);
    lines.push(`      let len = ${val}.length;`);
    lines.push(`      buf[pos++] = len >> 24;`);
    lines.push(`      buf[pos++] = len >> 16;`);
    lines.push(`      buf[pos++] = len >> 8;`);
    lines.push(`      buf[pos++] = len & 0xff;`);
    lines.push(`      ${val}.copy(buf, pos);`);
    lines.push(`      pos += len;`);
    lines.push(`    } else if (${val} instanceof Uint8Array) {`);
    lines.push(`      let len = ${val}.length;`);
    lines.push(`      buf[pos++] = len >> 24;`);
    lines.push(`      buf[pos++] = len >> 16;`);
    lines.push(`      buf[pos++] = len >> 8;`);
    lines.push(`      buf[pos++] = len & 0xff;`);
    lines.push(`      buf.set(${val}, pos);`);
    lines.push(`      pos += len;`);
    lines.push(`    } else {`);
    lines.push(`      const b64Buf = Buffer.from(${val}, 'base64');`);
    lines.push(`      let len = b64Buf.length;`);
    lines.push(`      buf[pos++] = len >> 24;`);
    lines.push(`      buf[pos++] = len >> 16;`);
    lines.push(`      buf[pos++] = len >> 8;`);
    lines.push(`      buf[pos++] = len & 0xff;`);
    lines.push(`      b64Buf.copy(buf, pos);`);
    lines.push(`      pos += len;`);
    lines.push(`    }`);
  }

  return lines.join('\n');
}
