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

/* OpenAPI Array Format Tests ----------------------------------------------- */

describe('OpenAPI-compatible array formats', () => {
  describe('Array of integers (int32)', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'integer', format: 'int32' } } });

    it('should preserve array of integers', () => {
      expect(Schema.read(Schema.write({ test: [1, 2, 3, 4, 5] }).buffer())).toEqual({ test: [1, 2, 3, 4, 5] });
    });

    it('should handle negative integers', () => {
      expect(Schema.read(Schema.write({ test: [-100, 0, 100] }).buffer())).toEqual({ test: [-100, 0, 100] });
    });
  });

  describe('Array of integers (int64)', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'integer', format: 'int64' } } });

    it('should preserve array of int64 values', () => {
      const data = { test: [9007199254740991, -9007199254740991, 0] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Array of floats', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'number', format: 'float' } } });

    it('should preserve array of floats with precision loss', () => {
      const result = Schema.read(Schema.write({ test: [3.14, 2.71, 1.41] }).buffer());
      expect(result.test[0]).toBeCloseTo(3.14, 5);
      expect(result.test[1]).toBeCloseTo(2.71, 5);
      expect(result.test[2]).toBeCloseTo(1.41, 5);
    });
  });

  describe('Array of doubles', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'number', format: 'double' } } });

    it('should preserve array of doubles', () => {
      expect(Schema.read(Schema.write({ test: [3.141592653589793, 2.718281828459045] }).buffer())).toEqual({ test: [3.141592653589793, 2.718281828459045] });
    });
  });

  describe('Array of UUIDs', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'string', format: 'uuid' } } });

    it('should preserve array of UUIDs', () => {
      const data = {
        test: [
          '550e8400-e29b-4d4e-a7d4-426614174000',
          '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          '00000000-0000-0000-0000-000000000000',
        ],
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should compress UUIDs efficiently', () => {
      const data = {
        test: ['550e8400-e29b-4d4e-a7d4-426614174000', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'],
      };
      const buffer = Schema.write(data).buffer();
      // Each UUID is 16 bytes + 1 byte size = 17 bytes per UUID
      // Plus array overhead
      expect(buffer.length).toBeLessThan(100); // Much less than string encoding
    });
  });

  describe('Array of IPv4 addresses', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'string', format: 'ipv4' } } });

    it('should preserve array of IPv4 addresses', () => {
      const data = { test: ['192.168.1.1', '10.0.0.1', '172.16.0.1'] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Array of IPv6 addresses', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'string', format: 'ipv6' } } });

    it('should preserve array of IPv6 addresses', () => {
      const data = {
        test: ['2001:db8:85a3::8a2e:370:7334', '::1', '::'],
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Array of dates', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'string', format: 'date' } } });

    it('should preserve array of dates', () => {
      const data = { test: ['2025-10-28', '2024-01-01', '1970-01-01'] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Array of date-times', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'string', format: 'date-time' } } });

    it('should preserve array of date-times', () => {
      const data = {
        test: ['2025-10-28T14:30:00.000Z', '2024-01-01T00:00:00.000Z'],
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Array of binary data', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'string', format: 'binary' } } });

    it('should preserve array of binary data', () => {
      const data = { test: ['SGVsbG8=', 'V29ybGQ=', 'Zm9vYmFy'] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle Buffer inputs', () => {
      const input = { test: [Buffer.from('Hello'), Buffer.from('World')] };
      const result = Schema.read(Schema.write(input).buffer());
      expect(result.test).toEqual(['SGVsbG8=', 'V29ybGQ=']);
    });
  });

  describe('Array with nullable items', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'string', nullable: true } } });

    it('should preserve null values in array', () => {
      const data = { test: ['a', null, 'b', null, 'c'] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should distinguish empty string from null', () => {
      const data = { test: ['', null, 'text'] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle all null array', () => {
      const data = { test: [null, null, null] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Array with nullable integer items', () => {
    const Schema = schema({ test: { type: 'array', items: { type: 'integer', format: 'int32', nullable: true } } });

    it('should preserve null values with integers', () => {
      const data = { test: [1, null, 2, null, 3] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should distinguish zero from null', () => {
      const data = { test: [0, null, -1] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Array with oneOf items', () => {
    const Schema = schema({
      test: {
        type: 'array',
        items: {
          oneOf: [
            { type: 'string' },
            { type: 'integer', format: 'int32' },
            { type: 'boolean' },
          ],
        },
      },
    });

    it('should handle mixed types in array', () => {
      const data = { test: ['hello', 42, true, 'world', false, 123] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle all strings', () => {
      const data = { test: ['a', 'b', 'c'] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle all integers', () => {
      const data = { test: [1, 2, 3] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle all booleans', () => {
      const data = { test: [true, false, true] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Array with anyOf items', () => {
    const Schema = schema({
      test: {
        type: 'array',
        items: {
          anyOf: [
            { type: 'number', format: 'double' },
            { type: 'string' },
          ],
        },
      },
    });

    it('should handle mixed numbers and strings', () => {
      const data = { test: [3.14, 'pi', 2.71, 'e'] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Array with oneOf and nullable items', () => {
    const Schema = schema({
      test: {
        type: 'array',
        items: {
          nullable: true,
          oneOf: [
            { type: 'string' },
            { type: 'integer', format: 'int32' },
          ],
        },
      },
    });

    it('should handle null with oneOf variants', () => {
      const data = { test: ['hello', null, 42, null, 'world'] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Nested arrays', () => {
    const Schema = schema({
      test: {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'integer', format: 'int32' },
        },
      },
    });

    it('should handle 2D arrays', () => {
      const data = { test: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle empty nested arrays', () => {
      const data = { test: [[], [1], []] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Nested arrays with strings', () => {
    const Schema = schema({
      test: {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    });

    it('should handle 2D string arrays', () => {
      const data = { test: [['a', 'b'], ['c', 'd', 'e'], ['f']] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Arrays of objects', () => {
    const Schema = schema({
      test: {
        type: 'array',
        items: {
          type: 'object',
          schema: {
            x: { type: 'integer', format: 'int32' },
            y: { type: 'integer', format: 'int32' },
          },
        },
      },
    });

    it('should handle array of objects', () => {
      const data = { test: [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }] };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Complex nested structure', () => {
    const Schema = schema({
      test: {
        type: 'array',
        items: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'integer', format: 'int32' } },
            { type: 'object', schema: { name: { type: 'string' } } },
          ],
        },
      },
    });

    it('should handle complex nested structures with oneOf', () => {
      const data = {
        test: [
          'hello',
          [1, 2, 3],
          { name: 'test' },
          'world',
          [4, 5],
        ],
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });
});

/* OpenAPI Object Format Tests ---------------------------------------------- */

describe('OpenAPI-compatible object formats', () => {
  describe('Object with various format types', () => {
    const Schema = schema({
      user: {
        type: 'object',
        schema: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          age: { type: 'integer', format: 'int32' },
          balance: { type: 'number', format: 'double' },
          active: { type: 'boolean' },
          created: { type: 'string', format: 'date-time' },
          ip: { type: 'string', format: 'ipv4' },
        },
      },
    });

    it('should preserve object with mixed format types', () => {
      const data = {
        user: {
          id: '550e8400-e29b-4d4e-a7d4-426614174000',
          name: 'John Doe',
          age: 30,
          balance: 1234.56,
          active: true,
          created: '2025-10-28T14:30:00.000Z',
          ip: '192.168.1.1',
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Object with nullable properties', () => {
    const Schema = schema({
      data: {
        type: 'object',
        schema: {
          required: { type: 'string' },
          optional: { type: 'string', nullable: true },
          number: { type: 'integer', format: 'int32', nullable: true },
        },
      },
    });

    it('should preserve null values in object properties', () => {
      const data = {
        data: {
          required: 'value',
          optional: null,
          number: null,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should preserve non-null values', () => {
      const data = {
        data: {
          required: 'value',
          optional: 'text',
          number: 42,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle mix of null and non-null', () => {
      const data = {
        data: {
          required: 'value',
          optional: 'text',
          number: null,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Object with oneOf properties', () => {
    const Schema = schema({
      response: {
        type: 'object',
        schema: {
          status: { type: 'integer', format: 'int32' },
          data: {
            oneOf: [
              { type: 'string' },
              { type: 'integer', format: 'int32' },
              { type: 'object', schema: { message: { type: 'string' } } },
            ],
          },
        },
      },
    });

    it('should handle string variant', () => {
      const data = {
        response: {
          status: 200,
          data: 'success',
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle integer variant', () => {
      const data = {
        response: {
          status: 200,
          data: 42,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle object variant', () => {
      const data = {
        response: {
          status: 200,
          data: { message: 'Operation completed' },
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Object with anyOf properties', () => {
    const Schema = schema({
      item: {
        type: 'object',
        schema: {
          id: { type: 'integer', format: 'int32' },
          value: {
            anyOf: [
              { type: 'number', format: 'double' },
              { type: 'string' },
            ],
          },
        },
      },
    });

    it('should handle number variant', () => {
      const data = {
        item: {
          id: 1,
          value: 3.14159,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle string variant', () => {
      const data = {
        item: {
          id: 1,
          value: 'text value',
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Deeply nested objects', () => {
    const Schema = schema({
      root: {
        type: 'object',
        schema: {
          level1: {
            type: 'object',
            schema: {
              level2: {
                type: 'object',
                schema: {
                  level3: {
                    type: 'object',
                    schema: {
                      value: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    it('should handle deeply nested objects', () => {
      const data = {
        root: {
          level1: {
            level2: {
              level3: {
                value: 'deep',
              },
            },
          },
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Object with array properties', () => {
    const Schema = schema({
      data: {
        type: 'object',
        schema: {
          tags: { type: 'array', items: { type: 'string' } },
          scores: { type: 'array', items: { type: 'integer', format: 'int32' } },
          metadata: {
            type: 'array',
            items: {
              type: 'object',
              schema: {
                key: { type: 'string' },
                value: { type: 'string' },
              },
            },
          },
        },
      },
    });

    it('should handle objects with array properties', () => {
      const data = {
        data: {
          tags: ['typescript', 'serialization'],
          scores: [10, 20, 30],
          metadata: [
            { key: 'author', value: 'John' },
            { key: 'version', value: '1.0' },
          ],
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Object with nullable oneOf properties', () => {
    const Schema = schema({
      record: {
        type: 'object',
        schema: {
          id: { type: 'integer', format: 'int32' },
          value: {
            nullable: true,
            oneOf: [
              { type: 'string' },
              { type: 'integer', format: 'int32' },
            ],
          },
        },
      },
    });

    it('should handle null in nullable oneOf', () => {
      const data = {
        record: {
          id: 1,
          value: null,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle string variant', () => {
      const data = {
        record: {
          id: 1,
          value: 'text',
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle integer variant', () => {
      const data = {
        record: {
          id: 1,
          value: 42,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Complex object with all OpenAPI features', () => {
    const Schema = schema({
      entity: {
        type: 'object',
        schema: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string' },
          attributes: {
            type: 'object',
            schema: {
              name: { type: 'string' },
              age: { type: 'integer', format: 'int32', nullable: true },
              balance: { type: 'number', format: 'double' },
            },
          },
          tags: { type: 'array', items: { type: 'string' } },
          metadata: {
            oneOf: [
              { type: 'string' },
              { type: 'object', schema: { key: { type: 'string' }, value: { type: 'string' } } },
            ],
          },
          created: { type: 'string', format: 'date-time' },
        },
      },
    });

    it('should handle complex object with all features', () => {
      const data = {
        entity: {
          id: '550e8400-e29b-4d4e-a7d4-426614174000',
          type: 'user',
          attributes: {
            name: 'John Doe',
            age: null,
            balance: 1234.56,
          },
          tags: ['active', 'premium'],
          metadata: { key: 'region', value: 'us-east-1' },
          created: '2025-10-28T14:30:00.000Z',
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle with string metadata variant', () => {
      const data = {
        entity: {
          id: '550e8400-e29b-4d4e-a7d4-426614174000',
          type: 'user',
          attributes: {
            name: 'Jane Doe',
            age: 25,
            balance: 5678.90,
          },
          tags: ['new'],
          metadata: 'simple string metadata',
          created: '2025-10-28T15:00:00.000Z',
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });
  });

  describe('Property order independence', () => {
    const Schema = schema({
      data: {
        type: 'object',
        schema: {
          first: { type: 'string' },
          second: { type: 'integer', format: 'int32' },
          third: { type: 'boolean' },
          fourth: { type: 'number', format: 'double' },
        },
      },
    });

    it('should handle properties in schema order', () => {
      const data = {
        data: {
          first: 'value1',
          second: 42,
          third: true,
          fourth: 3.14,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(data);
    });

    it('should handle properties in different order than schema', () => {
      const data = {
        data: {
          fourth: 3.14,
          first: 'value1',
          third: true,
          second: 42,
        },
      };
      const expected = {
        data: {
          first: 'value1',
          second: 42,
          third: true,
          fourth: 3.14,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(expected);
    });

    it('should handle properties in reverse order', () => {
      const data = {
        data: {
          fourth: 2.71,
          third: false,
          second: 100,
          first: 'reversed',
        },
      };
      const expected = {
        data: {
          first: 'reversed',
          second: 100,
          third: false,
          fourth: 2.71,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(expected);
    });

    it('should handle properties in random order', () => {
      const data = {
        data: {
          third: true,
          first: 'random',
          fourth: 1.41,
          second: 7,
        },
      };
      const expected = {
        data: {
          first: 'random',
          second: 7,
          third: true,
          fourth: 1.41,
        },
      };
      expect(Schema.read(Schema.write(data).buffer())).toEqual(expected);
    });
  });

  describe('Undeclared properties validation', () => {
    const Schema = schema({
      data: {
        type: 'object',
        schema: {
          declared: { type: 'string' },
        },
      },
    });

    it('should ignore undeclared properties', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const input = {
        data: {
          declared: 'value',
          undeclared: 'should be ignored',
        },
      };
      const result = Schema.read(Schema.write(input).buffer());
      expect(result).toEqual({ data: { declared: 'value' } });
      expect(result.data).not.toHaveProperty('undeclared');

      warnSpy.mockRestore();
    });

    it('should always warn about undeclared properties', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const input = {
        data: {
          declared: 'value',
          extra1: 'ignored',
          extra2: 'also ignored',
        },
      };

      Schema.write(input);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('undeclared properties'),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('extra1, extra2'),
      );

      warnSpy.mockRestore();
    });

    it('should not warn when all properties are declared', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const input = {
        data: {
          declared: 'value',
        },
      };

      Schema.write(input);

      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
