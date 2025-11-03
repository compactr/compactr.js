import Decoder, { NULL_INDICATOR, VARIANT_BASE } from './decoder';

export default function Reader(scope) {
  function read(bytes, offset = 0, length?) {
    const ret = {};
    const end = length !== undefined ? offset + length : bytes.length;
    let caret = offset + 1;
    const fieldCount = bytes[offset];

    for (let i = 0; i < fieldCount; i++) {
      if (caret >= end) break;

      const fieldIndex = bytes[caret];
      caret++;

      const field = scope.indexToField[fieldIndex];
      if (!field) {
        throw new Error(`Unknown field index: ${fieldIndex}`);
      }

      if (field.nullable || field.variants) {
        const discriminatorByte = bytes[caret];
        caret++;

        if (discriminatorByte === NULL_INDICATOR) {
          ret[field.name] = null;
          continue;
        }

        if (field.variants) {
          const variantIndex = discriminatorByte - VARIANT_BASE;
          if (variantIndex < 0 || variantIndex >= field.variants.length) {
            throw new Error(`Invalid variant discriminator: ${discriminatorByte}`);
          }

          const variant = field.variants[variantIndex];
          const size = variant.size || readSize(bytes, caret, variant.count);
          caret += variant.count;

          ret[field.name] = variant.transformOut(bytes, caret, size);
          caret += size;
          continue;
        }

        const size = field.size || readSize(bytes, caret, field.count);
        caret += field.count;

        ret[field.name] = field.transformOut(bytes, caret, size);
        caret += size;
      }
      else {
        const size = field.size || readSize(bytes, caret, field.count);
        caret += field.count;

        ret[field.name] = field.transformOut(bytes, caret, size);
        caret += size;
      }
    }

    return ret;
  }

  function readSize(bytes, offset, count) {
    if (count === 1) return bytes[offset];
    if (count === 2) return (bytes[offset] << 8) | bytes[offset + 1];
    if (count === 4) {
      return (bytes[offset] << 24) | (bytes[offset + 1] << 16)
        | (bytes[offset + 2] << 8) | bytes[offset + 3];
    }
    return Decoder.unsigned(bytes.slice(offset, offset + count));
  }

  function readFromOffset(bytes, offset, length) {
    return read(bytes, offset, length);
  }

  return { read, readFromOffset };
}
