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

  describe('String', () => {
    const Schema = schema({ test: { type: 'string' } });

    it('should preserve string value and type', () => {
      expect(Schema.read(Schema.write({ test: 'hello world' }).buffer())).toEqual({ test: 'hello world' });
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
