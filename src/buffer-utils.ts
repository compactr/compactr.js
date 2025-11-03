import { matchesVariant } from './variant-matcher';

const VARIANT_BASE = 0x01;

export function writeSize(buffer: Uint8Array, pos: number, size: number, count: number): number {
  if (count === 1) {
    buffer[pos] = size & 0xff;
    return pos + 1;
  }
  if (count === 2) {
    buffer[pos] = size >> 8;
    buffer[pos + 1] = size & 0xff;
    return pos + 2;
  }
  if (count === 4) {
    buffer[pos] = size >> 24;
    buffer[pos + 1] = size >> 16;
    buffer[pos + 2] = size >> 8;
    buffer[pos + 3] = size & 0xff;
    return pos + 4;
  }
  return pos;
}

export function writeFieldWithSize(
  buffer: Uint8Array,
  pos: number,
  value: any,
  field: any,
): number {
  if (field.size) {
    pos = writeSize(buffer, pos, field.size, field.count);
    return field.transformIn(value, buffer, pos);
  }

  const sizePos = pos;
  pos += field.count;
  const dataStart = pos;
  pos = field.transformIn(value, buffer, pos);
  const size = pos - dataStart;
  writeSize(buffer, sizePos, size, field.count);
  return pos;
}

export function processVariantWrite(
  buffer: Uint8Array,
  pos: number,
  data: any,
  field: any,
  contextName?: string,
): number {
  let variantIndex = -1;
  let variantField = null;

  for (let v = 0; v < field.variants.length; v++) {
    if (matchesVariant(data, field.variants[v])) {
      variantIndex = v;
      variantField = field.variants[v];
      break;
    }
  }

  if (variantIndex === -1) {
    const context = contextName || 'Data';
    throw new Error(`${context} does not match any variant`);
  }

  buffer[pos++] = VARIANT_BASE + variantIndex;
  return writeFieldWithSize(buffer, pos, data, variantField);
}
