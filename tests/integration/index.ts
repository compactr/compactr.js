/**
 * Unit test suite
 */

/* Requires ------------------------------------------------------------------ */

import { schema } from '../../src';

/* Tests --------------------------------------------------------------------- */

describe('Data integrity - simple', () => {
  describe('Boolean', () => {
    const Schema = schema({ test: { type: 'boolean' } });

    it('should preserve boolean value and type - true', () => {
      expect(Schema.read(Schema.write({ test: true }).buffer())).toEqual({ test: true });
    });

    it('should preserve boolean value and type - false', () => {
      expect(Schema.read(Schema.write({ test: false }).buffer())).toEqual({ test: false });
    });

    it('should skip null or undefined values', () => {
      expect(Schema.read(Schema.write({ test: null }).buffer())).toEqual({});
    });
  });

  describe('Number', () => {
    const Schema = schema({ test: { type: 'number', format: 'double' } });

    it('should preserve number value and type', () => {
      expect(Schema.read(Schema.write({ test: 23.23 }).buffer())).toEqual({ test: 23.23 });
    });

    it('should preserve number value and type for negative values', () => {
      expect(Schema.read(Schema.write({ test: -23.23 }).buffer())).toEqual({ test: -23.23 });
    });
  });

  describe('Integer', () => {
    const Schema = schema({ test: { type: 'integer', format: 'int32' } });

    it('should preserve integer value and type', () => {
      expect(Schema.read(Schema.write({ test: 123 }).buffer())).toEqual({ test: 123 });
    });

    it('should preserve integer value and type for negative values', () => {
      expect(Schema.read(Schema.write({ test: -456 }).buffer())).toEqual({ test: -456 });
    });
  });

  describe('Integer (int64)', () => {
    const Schema = schema({ test: { type: 'integer', format: 'int64' } });

    it('should preserve int64 value and type', () => {
      expect(Schema.read(Schema.write({ test: 9007199254740991 }).buffer())).toEqual({ test: 9007199254740991 });
    });

    it('should preserve int64 value and type for negative values', () => {
      expect(Schema.read(Schema.write({ test: -9007199254740991 }).buffer())).toEqual({ test: -9007199254740991 });
    });
  });

  describe('Number (float)', () => {
    const Schema = schema({ test: { type: 'number', format: 'float' } });

    it('should preserve float value (with precision loss)', () => {
      const result = Schema.read(Schema.write({ test: 3.14159 }).buffer());
      expect(result.test).toBeCloseTo(3.14159, 5);
    });

    it('should preserve float value for negative values', () => {
      const result = Schema.read(Schema.write({ test: -2.71828 }).buffer());
      expect(result.test).toBeCloseTo(-2.71828, 5);
    });
  });

  describe('Plain Integer (no format)', () => {
    const Schema = schema({ test: { type: 'integer' } });

    it('should default to int32 format', () => {
      expect(Schema.read(Schema.write({ test: 42 }).buffer())).toEqual({ test: 42 });
    });

    it('should handle negative values', () => {
      expect(Schema.read(Schema.write({ test: -42 }).buffer())).toEqual({ test: -42 });
    });
  });

  describe('Plain Number (no format)', () => {
    const Schema = schema({ test: { type: 'number' } });

    it('should default to double format', () => {
      expect(Schema.read(Schema.write({ test: 3.141592653589793 }).buffer())).toEqual({ test: 3.141592653589793 });
    });

    it('should handle negative values', () => {
      expect(Schema.read(Schema.write({ test: -2.718281828459045 }).buffer())).toEqual({ test: -2.718281828459045 });
    });
  });

  describe('String', () => {
    const Schema = schema({ test: { type: 'string' } });

    it('should preserve string value and type', () => {
      expect(Schema.read(Schema.write({ test: 'hello world' }).buffer())).toEqual({ test: 'hello world' });
    });

    it('should support special characters', () => {
      expect(Schema.read(Schema.write({ test: '한자' }).buffer())).toEqual({ test: '한자' });
    });

    it('should support emojis', () => {
      expect(Schema.read(Schema.write({ test: '🚀' }).buffer())).toEqual({ test: '🚀' });
    });
  });

  describe('UUID', () => {
    const Schema = schema({ test: { type: 'string', format: 'uuid' } });

    it('should preserve UUID value', () => {
      const uuid = '550e8400-e29b-4d4e-a7d4-426614174000';
      expect(Schema.read(Schema.write({ test: uuid }).buffer())).toEqual({ test: uuid });
    });

    it('should compress UUID to 16 bytes instead of 72', () => {
      const uuid = '550e8400-e29b-4d4e-a7d4-426614174000';
      const buffer = Schema.write({ test: uuid }).buffer();
      // Header: 1 byte (field count) + 1 byte (field index) + 1 byte (size) = 3 bytes
      // Content: 16 bytes (UUID binary)
      // Total: 19 bytes (vs 75 bytes for string encoding: 3 header + 72 content)
      expect(buffer.length).toBe(19);
    });

    it('should handle uppercase UUIDs', () => {
      const uuid = '550E8400-E29B-4D4E-A7D4-426614174000';
      const result = Schema.read(Schema.write({ test: uuid }).buffer());
      // UUID should be normalized to lowercase
      expect(result.test).toBe('550e8400-e29b-4d4e-a7d4-426614174000');
    });

    it('should handle nil UUID', () => {
      const uuid = '00000000-0000-0000-0000-000000000000';
      expect(Schema.read(Schema.write({ test: uuid }).buffer())).toEqual({ test: uuid });
    });
  });

  describe('IPv4', () => {
    const Schema = schema({ test: { type: 'string', format: 'ipv4' } });

    it('should preserve IPv4 value', () => {
      const ip = '192.168.1.1';
      expect(Schema.read(Schema.write({ test: ip }).buffer())).toEqual({ test: ip });
    });

    it('should compress IPv4 to 4 bytes instead of 30', () => {
      const ip = '192.168.1.1';
      const buffer = Schema.write({ test: ip }).buffer();
      // Header: 1 byte (field count) + 1 byte (field index) + 1 byte (size) = 3 bytes
      // Content: 4 bytes (IPv4 binary)
      // Total: 7 bytes (vs 33 bytes for string encoding)
      expect(buffer.length).toBe(7);
    });

    it('should handle edge cases', () => {
      expect(Schema.read(Schema.write({ test: '0.0.0.0' }).buffer())).toEqual({ test: '0.0.0.0' });
      expect(Schema.read(Schema.write({ test: '255.255.255.255' }).buffer())).toEqual({ test: '255.255.255.255' });
    });
  });

  describe('IPv6', () => {
    const Schema = schema({ test: { type: 'string', format: 'ipv6' } });

    it('should compress IPv6 value', () => {
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      expect(Schema.read(Schema.write({ test: ip }).buffer())).toEqual({ test: '2001:db8:85a3::8a2e:370:7334' });
    });

    it('should compress IPv6 to 16 bytes instead of 78', () => {
      const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const buffer = Schema.write({ test: ip }).buffer();
      // Header: 1 byte (field count) + 1 byte (field index) + 1 byte (size) = 3 bytes
      // Content: 16 bytes (IPv6 binary)
      // Total: 19 bytes (vs 81 bytes for string encoding)
      expect(buffer.length).toBe(19);
    });

    it('should handle compressed IPv6 notation', () => {
      const ip = '2001:db8:85a3::8a2e:370:7334';
      const result = Schema.read(Schema.write({ test: ip }).buffer());
      // Should be decoded back with compression
      expect(result.test).toBe(ip);
    });

    it('should handle loopback', () => {
      const ip = '::1';
      const result = Schema.read(Schema.write({ test: ip }).buffer());
      expect(result.test).toBe('::1');
    });

    it('should handle all zeros', () => {
      const ip = '::';
      const result = Schema.read(Schema.write({ test: ip }).buffer());
      expect(result.test).toBe('::');
    });
  });

  describe('Date', () => {
    const Schema = schema({ test: { type: 'string', format: 'date' } });

    it('should preserve date value', () => {
      const date = '2025-10-28';
      expect(Schema.read(Schema.write({ test: date }).buffer())).toEqual({ test: date });
    });

    it('should compress date to 4 bytes instead of 20', () => {
      const date = '2025-10-28';
      const buffer = Schema.write({ test: date }).buffer();
      // Header: 1 byte (field count) + 1 byte (field index) + 1 byte (size) = 3 bytes
      // Content: 4 bytes (days since epoch)
      // Total: 7 bytes (vs 23 bytes for string encoding)
      expect(buffer.length).toBe(7);
    });

    it('should handle epoch date', () => {
      const date = '1970-01-01';
      expect(Schema.read(Schema.write({ test: date }).buffer())).toEqual({ test: date });
    });

    it('should handle dates before epoch', () => {
      const date = '1969-12-31';
      expect(Schema.read(Schema.write({ test: date }).buffer())).toEqual({ test: date });
    });

    it('should handle far future dates', () => {
      const date = '2099-12-31';
      expect(Schema.read(Schema.write({ test: date }).buffer())).toEqual({ test: date });
    });
  });

  describe('DateTime', () => {
    const Schema = schema({ test: { type: 'string', format: 'date-time' } });

    it('should preserve date-time value', () => {
      const datetime = '2025-10-28T14:30:00.000Z';
      expect(Schema.read(Schema.write({ test: datetime }).buffer())).toEqual({ test: datetime });
    });

    it('should compress date-time to 8 bytes instead of 40+', () => {
      const datetime = '2025-10-28T14:30:00.000Z';
      const buffer = Schema.write({ test: datetime }).buffer();
      // Header: 1 byte (field count) + 1 byte (field index) + 1 byte (size) = 3 bytes
      // Content: 8 bytes (milliseconds since epoch)
      // Total: 11 bytes (vs 43+ bytes for string encoding)
      expect(buffer.length).toBe(11);
    });

    it('should handle epoch datetime', () => {
      const datetime = '1970-01-01T00:00:00.000Z';
      expect(Schema.read(Schema.write({ test: datetime }).buffer())).toEqual({ test: datetime });
    });

    it('should handle millisecond precision', () => {
      const datetime = '2025-10-28T14:30:00.123Z';
      expect(Schema.read(Schema.write({ test: datetime }).buffer())).toEqual({ test: datetime });
    });

    it('should normalize various ISO 8601 formats', () => {
      // Input without milliseconds, output should have .000Z
      const input = '2025-10-28T14:30:00Z';
      const result = Schema.read(Schema.write({ test: input }).buffer());
      expect(result.test).toBe('2025-10-28T14:30:00.000Z');
    });
  });

  describe('Binary', () => {
    const Schema = schema({ test: { type: 'string', format: 'binary' } });

    it('should preserve binary data via base64', () => {
      const base64 = 'SGVsbG8gV29ybGQh'; // "Hello World!"
      expect(Schema.read(Schema.write({ test: base64 }).buffer())).toEqual({ test: base64 });
    });

    it('should compress binary data efficiently', () => {
      const base64 = 'SGVsbG8gV29ybGQh'; // 16 chars = 32 bytes as string
      const buffer = Schema.write({ test: base64 }).buffer();
      // Header: 1 byte (field count) + 1 byte (field index) + 4 bytes (size) = 6 bytes
      // Content: 12 bytes (raw binary data decoded from base64)
      // Total: 18 bytes (vs 35 bytes for string encoding)
      expect(buffer.length).toBe(18);
    });

    it('should handle Buffer input', () => {
      const data = Buffer.from('Hello World!', 'utf8');
      const result = Schema.read(Schema.write({ test: data }).buffer());
      expect(result.test).toBe('SGVsbG8gV29ybGQh');
    });

    it('should handle Uint8Array input', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]);
      const result = Schema.read(Schema.write({ test: data }).buffer());
      expect(result.test).toBe('SGVsbG8='); // "Hello" in base64
    });

    it('should handle empty binary data', () => {
      const base64 = ''; // Empty
      expect(Schema.read(Schema.write({ test: base64 }).buffer())).toEqual({ test: base64 });
    });

    it('should handle large binary data', () => {
      // Create 256 bytes of data
      const bytes = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        bytes[i] = i;
      }
      const base64 = Buffer.from(bytes).toString('base64');
      expect(Schema.read(Schema.write({ test: base64 }).buffer())).toEqual({ test: base64 });
    });
  });

  describe('Array', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'string' } } });

    it('should preserve array values and types', () => {
      expect(Schema.read(Schema.write({ test: ['a', 'b', 'c'] }).buffer())).toEqual({ test: ['a', 'b', 'c'] });
    });
  });

  describe('Schema', () => {
    const Schema = schema({ test: { type: 'object', schema: { test: { type: 'number', format: 'double' } } } });

    it('should preserve object values and types', () => {
      expect(Schema.read(Schema.write({ test: { test: 23.23 } }).buffer())).toEqual({ test: { test: 23.23 } });
    });
  });

  describe('OneOf', () => {
    const Schema = schema({
      value: {
        oneOf: [
          { type: 'string' },
          { type: 'integer', format: 'int32' },
          { type: 'boolean' },
        ],
      },
    });

    it('should handle string variant (first)', () => {
      const data = { value: 'hello' };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle integer variant (second)', () => {
      const data = { value: 42 };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle boolean variant (third)', () => {
      const data = { value: true };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should use correct discriminator for each variant', () => {
      // String (first variant) should have discriminator 0x01
      const stringBuffer = Schema.write({ value: 'test' }).buffer();
      expect(stringBuffer[2]).toBe(0x01); // discriminator byte

      // Integer (second variant) should have discriminator 0x02
      const intBuffer = Schema.write({ value: 42 }).buffer();
      expect(intBuffer[2]).toBe(0x02); // discriminator byte

      // Boolean (third variant) should have discriminator 0x03
      const boolBuffer = Schema.write({ value: true }).buffer();
      expect(boolBuffer[2]).toBe(0x03); // discriminator byte
    });
  });

  describe('AnyOf', () => {
    const Schema = schema({
      data: {
        anyOf: [
          { type: 'number', format: 'double' },
          { type: 'string' },
        ],
      },
    });

    it('should handle number variant', () => {
      const data = { data: 3.14 };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle string variant', () => {
      const data = { data: 'hello' };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('OneOf with nullable', () => {
    const Schema = schema({
      value: {
        nullable: true,
        oneOf: [
          { type: 'string' },
          { type: 'integer', format: 'int32' },
        ],
      },
    });

    it('should handle null value', () => {
      const data = { value: null };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle string variant when not null', () => {
      const data = { value: 'test' };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle integer variant when not null', () => {
      const data = { value: 123 };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should use 0x00 for null, 0x01+ for variants', () => {
      // Null should use 0x00
      const nullBuffer = Schema.write({ value: null }).buffer();
      expect(nullBuffer[2]).toBe(0x00);

      // String variant should use 0x01
      const stringBuffer = Schema.write({ value: 'test' }).buffer();
      expect(stringBuffer[2]).toBe(0x01);

      // Integer variant should use 0x02
      const intBuffer = Schema.write({ value: 42 }).buffer();
      expect(intBuffer[2]).toBe(0x02);
    });
  });

  describe('OneOf with complex types', () => {
    const Schema = schema({
      item: {
        oneOf: [
          { type: 'array', items: { type: 'string' } },
          { type: 'object', schema: { x: { type: 'integer', format: 'int32' }, y: { type: 'integer', format: 'int32' } } },
        ],
      },
    });

    it('should handle array variant', () => {
      const data = { item: ['a', 'b', 'c'] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle object variant', () => {
      const data = { item: { x: 10, y: 20 } };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });
});

describe('Data integrity - multi simple', () => {
  describe('Booleans', () => {
    const Schema = schema({ test: { type: 'boolean' }, test2: { type: 'boolean' } });

    it('should preserve boolean value and type - false', () => {
      expect(Schema.read(Schema.write({ test: false, test2: true }).buffer())).toEqual({ test: false, test2: true });
    });

    it('should skip null or undefined values', () => {
      expect(Schema.read(Schema.write({ test: null, test2: false }).buffer())).toEqual({ test2: false });
    });
  });

  describe('Numbers', () => {
    const Schema = schema({ test: { type: 'number', format: 'double' }, test2: { type: 'number', format: 'double' } });

    it('should preserve number value and type', () => {
      expect(Schema.read(Schema.write({ test: 23.23, test2: -97.7 }).buffer())).toEqual({ test: 23.23, test2: -97.7 });
    });
  });

  describe('Strings', () => {
    const Schema = schema({ test: { type: 'string' }, test2: { type: 'string' } });

    it('should preserve string value and type', () => {
      expect(Schema.read(Schema.write({ test: 'hello world', test2: 'écho' }).buffer())).toEqual({ test: 'hello world', test2: 'écho' });
    });
  });

  describe('Arrays', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'string' } }, test2: { type: 'array', items: { type: 'string' } } });

    it('should preserve array values and types', () => {
      expect(Schema.read(Schema.write({ test: ['a', 'b', 'c'], test2: ['d', 'e', 'f'] }).buffer())).toEqual({ test: ['a', 'b', 'c'], test2: ['d', 'e', 'f'] });
    });
  });

  describe('Schemas', () => {
    const Schema = schema({ test: { type: 'object', schema: { test: { type: 'number', format: 'double' } } }, test2: { type: 'object', schema: { test: { type: 'number', format: 'double' } } } });

    it('should preserve object values and types', () => {
      expect(Schema.read(Schema.write({ test: { test: 23.23 }, test2: { test: -97.7 } }).buffer())).toEqual({ test: { test: 23.23 }, test2: { test: -97.7 } });
    });
  });
});

describe('Data integrity - multi mixed', () => {
  describe('Boolean + number + string + array + object', () => {
    const Schema = schema({
      bool: { type: 'boolean' },
      num: { type: 'number', format: 'double' },
      str: { type: 'string' },
      arr: { type: 'array', items: { type: 'string' } },
      obj: { type: 'object', schema: { sub: { type: 'string' } } },
    });

    it('should preserve values and types', () => {
      expect(Schema.read(Schema.write({ bool: true, num: 23.23, str: 'hello world', arr: ['a', 'b', 'c'], obj: { sub: 'way' } }).buffer())).toEqual({ bool: true, num: 23.23, str: 'hello world', arr: ['a', 'b', 'c'], obj: { sub: 'way' } });
    });
  });
});

/* Partial ------------------------------------------------------------------- */

describe('Data integrity - partial - simple', () => {
  describe('Boolean', () => {
    const Schema = schema({ test: { type: 'boolean' } });

    it('should preserve boolean value and type - true', () => {
      expect(Schema.readContent(Schema.write({ test: true }).contentBuffer())).toEqual({ test: true });
    });

    it('should preserve boolean value and type - false', () => {
      expect(Schema.readContent(Schema.write({ test: false }).contentBuffer())).toEqual({ test: false });
    });

    it('should still send one 0 byte in case of null (coersed)', () => {
      expect(Schema.readContent(Schema.write({ test: null }).contentBuffer())).toEqual({ test: false });
    });
  });

  describe('Number', () => {
    const Schema = schema({ test: { type: 'number', format: 'double' } });

    it('should preserve number value and type', () => {
      expect(Schema.readContent(Schema.write({ test: 23.23 }).contentBuffer())).toEqual({ test: 23.23 });
    });

    it('should preserve number value and type for negative values', () => {
      expect(Schema.readContent(Schema.write({ test: -23.23 }).contentBuffer())).toEqual({ test: -23.23 });
    });
  });

  describe('String', () => {
    const Schema = schema({ test: { type: 'string', size: 22 } });

    it('should preserve string value and type', () => {
      expect(Schema.readContent(Schema.write({ test: 'hello world' }).contentBuffer())).toEqual({ test: 'hello world' });
    });
  });

  describe('Array', () => {
    const Schema = schema({ test: { type: 'array', size: 12, items: { type: 'string' } } });

    it('should preserve array values and types', () => {
      expect(Schema.readContent(Schema.write({ test: ['a', 'b', 'c'] }).contentBuffer())).toEqual({ test: ['a', 'b', 'c', '', '', ''] });
    });
  });

  describe('Schema', () => {
    const Schema = schema({ test: { type: 'object', size: 20, schema: { test: { type: 'number', format: 'double' } } } });

    it('should preserve object values and types', () => {
      expect(Schema.readContent(Schema.write({ test: { test: 23.23 } }).contentBuffer())).toEqual({ test: { test: 23.23 } });
    });
  });
});

describe('Data integrity - partial - multi simple', () => {
  describe('Booleans', () => {
    const Schema = schema({ test: { type: 'boolean' }, test2: { type: 'boolean' } });

    it('should preserve boolean value and type - false', () => {
      expect(Schema.readContent(Schema.write({ test: false, test2: true }).contentBuffer())).toEqual({ test: false, test2: true });
    });

    it('should skip null or undefined values', () => {
      expect(Schema.readContent(Schema.write({ test: null, test2: false }).contentBuffer())).toEqual({ test: false, test2: false });
    });
  });

  describe('Numbers', () => {
    const Schema = schema({ test: { type: 'number', format: 'double' }, test2: { type: 'number', format: 'double' } });

    it('should preserve number value and type', () => {
      expect(Schema.readContent(Schema.write({ test: 23.23, test2: -97.7 }).contentBuffer())).toEqual({ test: 23.23, test2: -97.7 });
    });
  });

  describe('Strings', () => {
    const Schema = schema({ test: { type: 'string', size: 22 }, test2: { type: 'string', size: 8 } });

    it('should preserve string value and type', () => {
      expect(Schema.readContent(Schema.write({ test: 'hello world', test2: 'écho' }).contentBuffer())).toEqual({ test: 'hello world', test2: 'écho' });
    });
  });

  describe('Arrays', () => {
    const Schema = schema({ test: { type: 'array', size: 9, items: { type: 'string' } }, test2: { type: 'array', size: 9, items: { type: 'string' } } });

    it('should preserve array values and types', () => {
      expect(Schema.readContent(Schema.write({ test: ['a', 'b', 'c'], test2: ['d', 'e', 'f'] }).contentBuffer())).toEqual({ test: ['a', 'b', 'c'], test2: ['d', 'e', 'f'] });
    });
  });

  describe('Schemas', () => {
    const Schema = schema({ test: { type: 'object', size: 11, schema: { test: { type: 'number', format: 'double' } } }, test2: { type: 'object', size: 11, schema: { test: { type: 'number', format: 'double' } } } });

    it('should preserve object values and types', () => {
      expect(Schema.readContent(Schema.write({ test: { test: 23.23 }, test2: { test: -97.7 } }).contentBuffer())).toEqual({ test: { test: 23.23 }, test2: { test: -97.7 } });
    });
  });
});

describe('Data integrity - partial - multi mixed', () => {
  describe('Boolean + number + string + array + object', () => {
    const Schema = schema({
      bool: { type: 'boolean' },
      num: { type: 'number', format: 'double' },
      str: { type: 'string', size: 22 },
      arr: { type: 'array', items: { type: 'string' }, size: 9 },
      obj: { type: 'object', size: 9, schema: { sub: { type: 'string' } } },
    });

    it('should preserve values and types', () => {
      expect(Schema.readContent(Schema.write({ bool: true, num: 23.23, str: 'hello world', arr: ['a', 'b', 'c'], obj: { sub: 'way' } }).contentBuffer())).toEqual({ bool: true, num: 23.23, str: 'hello world', arr: ['a', 'b', 'c'], obj: { sub: 'way' } });
    });
  });
});

/* Size comparison tests ----------------------------------------------------- */

describe('Format size differences', () => {
  describe('Float vs Double', () => {
    const FloatSchema = schema({ value: { type: 'number', format: 'float' } });
    const DoubleSchema = schema({ value: { type: 'number', format: 'double' } });

    it('float should use 4 bytes for content', () => {
      const buffer = FloatSchema.write({ value: 3.14 }).contentBuffer();
      expect(buffer.length).toBe(4);
    });

    it('double should use 8 bytes for content', () => {
      const buffer = DoubleSchema.write({ value: 3.14 }).contentBuffer();
      expect(buffer.length).toBe(8);
    });
  });

  describe('Int32 vs Int64', () => {
    const Int32Schema = schema({ value: { type: 'integer', format: 'int32' } });
    const Int64Schema = schema({ value: { type: 'integer', format: 'int64' } });

    it('int32 should use 4 bytes for content', () => {
      const buffer = Int32Schema.write({ value: 12345 }).contentBuffer();
      expect(buffer.length).toBe(4);
    });

    it('int64 should use 8 bytes for content', () => {
      const buffer = Int64Schema.write({ value: 12345 }).contentBuffer();
      expect(buffer.length).toBe(8);
    });
  });
});

/* Nullable properties tests ------------------------------------------------- */

describe('Nullable properties', () => {
  describe('Nullable string', () => {
    const Schema = schema({ test: { type: 'string', nullable: true } });

    it('should preserve null value', () => {
      expect(Schema.read(Schema.write({ test: null }).buffer())).toEqual({ test: null });
    });

    it('should preserve non-null string value', () => {
      expect(Schema.read(Schema.write({ test: 'hello' }).buffer())).toEqual({ test: 'hello' });
    });

    it('should encode null with minimal bytes (header only)', () => {
      const buffer = Schema.write({ test: null }).buffer();
      const nonNullBuffer = Schema.write({ test: 'a' }).buffer();
      expect(buffer.length).toBeLessThan(nonNullBuffer.length);
    });
  });

  describe('Nullable number', () => {
    const Schema = schema({ test: { type: 'number', format: 'double', nullable: true } });

    it('should preserve null value', () => {
      expect(Schema.read(Schema.write({ test: null }).buffer())).toEqual({ test: null });
    });

    it('should preserve non-null number value', () => {
      expect(Schema.read(Schema.write({ test: 42.5 }).buffer())).toEqual({ test: 42.5 });
    });
  });

  describe('Nullable integer', () => {
    const Schema = schema({ test: { type: 'integer', format: 'int32', nullable: true } });

    it('should preserve null value', () => {
      expect(Schema.read(Schema.write({ test: null }).buffer())).toEqual({ test: null });
    });

    it('should preserve non-null integer value', () => {
      expect(Schema.read(Schema.write({ test: 123 }).buffer())).toEqual({ test: 123 });
    });
  });

  describe('Nullable boolean', () => {
    const Schema = schema({ test: { type: 'boolean', nullable: true } });

    it('should preserve null value', () => {
      expect(Schema.read(Schema.write({ test: null }).buffer())).toEqual({ test: null });
    });

    it('should preserve false value (not confused with null)', () => {
      expect(Schema.read(Schema.write({ test: false }).buffer())).toEqual({ test: false });
    });

    it('should preserve true value', () => {
      expect(Schema.read(Schema.write({ test: true }).buffer())).toEqual({ test: true });
    });
  });

  describe('Mixed nullable and non-nullable', () => {
    const Schema = schema({
      nullableField: { type: 'string', nullable: true },
      regularField: { type: 'string' },
      anotherNullable: { type: 'integer', format: 'int32', nullable: true },
    });

    it('should handle mix of null and non-null values', () => {
      const data = { nullableField: null, regularField: 'hello', anotherNullable: 42 };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should skip non-nullable fields when null', () => {
      const data = { nullableField: 'test', regularField: null, anotherNullable: null };
      const result = Schema.read(Schema.write(data).buffer());
      expect(result).toEqual({ nullableField: 'test', anotherNullable: null });
      expect(result.regularField).toBeUndefined();
    });

    it('should preserve all null values in nullable fields', () => {
      const data = { nullableField: null, regularField: 'value', anotherNullable: null };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Nullable object', () => {
    const Schema = schema({
      test: {
        type: 'object',
        nullable: true,
        schema: { name: { type: 'string' } },
      },
    });

    it('should preserve null value', () => {
      expect(Schema.read(Schema.write({ test: null }).buffer())).toEqual({ test: null });
    });

    it('should preserve non-null object value', () => {
      expect(Schema.read(Schema.write({ test: { name: 'John' } }).buffer())).toEqual({ test: { name: 'John' } });
    });
  });

  describe('Nullable array', () => {
    const Schema = schema({
      test: {
        type: 'array',
        nullable: true,
        items: { type: 'string' },
      },
    });

    it('should preserve null value', () => {
      expect(Schema.read(Schema.write({ test: null }).buffer())).toEqual({ test: null });
    });

    it('should preserve non-null array value', () => {
      expect(Schema.read(Schema.write({ test: ['a', 'b', 'c'] }).buffer())).toEqual({ test: ['a', 'b', 'c'] });
    });

    it('should preserve empty array (different from null)', () => {
      expect(Schema.read(Schema.write({ test: [] }).buffer())).toEqual({ test: [] });
    });

    it('empty array should have different encoding than null', () => {
      const emptyArrayBuffer = Schema.write({ test: [] }).buffer();
      const nullBuffer = Schema.write({ test: null }).buffer();
      expect(emptyArrayBuffer).not.toEqual(nullBuffer);
    });
  });

  describe('Empty vs null distinction', () => {
    describe('Empty string vs null', () => {
      const Schema = schema({ test: { type: 'string', nullable: true } });

      it('should distinguish empty string from null', () => {
        const emptyString = Schema.read(Schema.write({ test: '' }).buffer());
        const nullValue = Schema.read(Schema.write({ test: null }).buffer());

        expect(emptyString).toEqual({ test: '' });
        expect(nullValue).toEqual({ test: null });
        expect(emptyString.test).not.toBe(nullValue.test);
      });

      it('should have different byte encodings', () => {
        const emptyStringBuffer = Schema.write({ test: '' }).buffer();
        const nullBuffer = Schema.write({ test: null }).buffer();
        expect(emptyStringBuffer).not.toEqual(nullBuffer);
      });
    });

    describe('Zero vs null for numbers', () => {
      const Schema = schema({ test: { type: 'number', format: 'double', nullable: true } });

      it('should distinguish zero from null', () => {
        const zero = Schema.read(Schema.write({ test: 0 }).buffer());
        const nullValue = Schema.read(Schema.write({ test: null }).buffer());

        expect(zero).toEqual({ test: 0 });
        expect(nullValue).toEqual({ test: null });
        expect(zero.test).not.toBe(nullValue.test);
      });
    });

    describe('False vs null for booleans', () => {
      const Schema = schema({ test: { type: 'boolean', nullable: true } });

      it('should distinguish false from null', () => {
        const falseValue = Schema.read(Schema.write({ test: false }).buffer());
        const nullValue = Schema.read(Schema.write({ test: null }).buffer());

        expect(falseValue).toEqual({ test: false });
        expect(nullValue).toEqual({ test: null });
        expect(falseValue.test).not.toBe(nullValue.test);
      });
    });
  });
});
