/**
 * Unit test suite
 */

/* Requires ------------------------------------------------------------------*/

const expect = require('chai').expect;
const Compactr = require('../');

/* Tests ---------------------------------------------------------------------*/

describe('Data integrity - simple', () => {
  describe('Boolean', () => {
    const Schema = Compactr.schema({ test: { type: 'boolean' } });

    it('should preserve boolean value and type - true', () => {
      expect(Schema.read(Schema.write({ test: true }).buffer())).to.deep.equal({ test: true });
    });

    it('should preserve boolean value and type - false', () => {
      expect(Schema.read(Schema.write({ test: false }).buffer())).to.deep.equal({ test: false });
    });

    it('should skip null or undefined values', () => {
      expect(Schema.read(Schema.write({ test: null }).buffer())).to.deep.equal({});
    });
  });

  describe('Number', () => {
    const Schema = Compactr.schema({ test: { type: 'number' } });

    it('should preserve number value and type', () => {
      expect(Schema.read(Schema.write({ test: 23.23 }).buffer())).to.deep.equal({ test: 23.23 });
    });

    it('should preserve number value and type for negative values', () => {
      expect(Schema.read(Schema.write({ test: -23.23 }).buffer())).to.deep.equal({ test: -23.23 });
    });
  });

  describe('String', () => {
    const Schema = Compactr.schema({ test: { type: 'string' } });

    it('should preserve string value and type', () => {
      expect(Schema.read(Schema.write({ test: 'hello world' }).buffer())).to.deep.equal({ test: 'hello world' });
    });
  });

  describe('Array', () => {
    const Schema = Compactr.schema({ test: { type: 'array', items: { type: 'string' } } });

    it('should preserve array values and types', () => {
      expect(Schema.read(Schema.write({ test: ['a', 'b', 'c'] }).buffer())).to.deep.equal({ test: ['a', 'b', 'c'] });
    });
  });

  describe('Schema', () => {
    const Schema = Compactr.schema({ test: { type: 'object', schema: { test: { type: 'number' } } } });

    it('should preserve object values and types', () => {
      expect(Schema.read(Schema.write({ test: { test: 23.23 } }).buffer())).to.deep.equal({ test: { test: 23.23 } });
    });
  });
});

describe('Data integrity - multi simple', () => {
  describe('Booleans', () => {
    const Schema = Compactr.schema({ test: { type: 'boolean' }, test2: { type: 'boolean' } });

    it('should preserve boolean value and type - false', () => {
      expect(Schema.read(Schema.write({ test: false, test2: true }).buffer())).to.deep.equal({ test: false, test2: true });
    });

    it('should skip null or undefined values', () => {
      expect(Schema.read(Schema.write({ test: null, test2: false }).buffer())).to.deep.equal({ test2: false });
    });
  });

  describe('Numbers', () => {
    const Schema = Compactr.schema({ test: { type: 'number' }, test2: { type: 'number' } });

    it('should preserve number value and type', () => {
      expect(Schema.read(Schema.write({ test: 23.23, test2: -97.7 }).buffer())).to.deep.equal({ test: 23.23, test2: -97.7 });
    });
  });

  describe('Strings', () => {
    const Schema = Compactr.schema({ test: { type: 'string' }, test2: { type: 'string' } });

    it('should preserve string value and type', () => {
      expect(Schema.read(Schema.write({ test: 'hello world', test2: 'écho' }).buffer())).to.deep.equal({ test: 'hello world', test2: 'écho' });
    });
  });

  describe('Arrays', () => {
    const Schema = Compactr.schema({ test: { type: 'array', items: { type: 'string' } }, test2: { type: 'array', items: { type: 'string' } } });

    it('should preserve array values and types', () => {
      expect(Schema.read(Schema.write({ test: ['a', 'b', 'c'], test2: ['d', 'e', 'f'] }).buffer())).to.deep.equal({ test: ['a', 'b', 'c'], test2: ['d', 'e', 'f'] });
    });
  });

  describe('Schemas', () => {
    const Schema = Compactr.schema({ test: { type: 'object', schema: { test: { type: 'number' } } }, test2: { type: 'object', schema: { test: { type: 'number' } } } });

    it('should preserve object values and types', () => {
      expect(Schema.read(Schema.write({ test: { test: 23.23 }, test2: { test: -97.7 } }).buffer())).to.deep.equal({ test: { test: 23.23 }, test2: { test: -97.7 } });
    });
  });
});

describe('Data integrity - multi mixed', () => {
  describe('Boolean + number + string + array + object', () => {
    const Schema = Compactr.schema({
      bool: { type: 'boolean' },
      num: { type: 'number' },
      str: { type: 'string' },
      arr: { type: 'array', items: { type: 'string' } },
      obj: { type: 'object', schema: { sub: { type: 'string' } } },
    });

    it('should preserve values and types', () => {
      expect(Schema.read(Schema.write({ bool: true, num: 23.23, str: 'hello world', arr: ['a', 'b', 'c'], obj: { sub: 'way' } }).buffer())).to.deep.equal({ bool: true, num: 23.23, str: 'hello world', arr: ['a', 'b', 'c'], obj: { sub: 'way' } });
    });
  });
});

/* Partial -------------------------------------------------------------------*/

describe('Data integrity - partial - simple', () => {
  describe('Boolean', () => {
    const Schema = Compactr.schema({ test: { type: 'boolean' } });

    it('should preserve boolean value and type - true', () => {
      expect(Schema.readContent(Schema.write({ test: true }).contentBuffer())).to.deep.equal({ test: true });
    });

    it('should preserve boolean value and type - false', () => {
      expect(Schema.readContent(Schema.write({ test: false }).contentBuffer())).to.deep.equal({ test: false });
    });

    it('should still send one 0 byte in case of null (coersed)', () => {
      expect(Schema.readContent(Schema.write({ test: null }).contentBuffer())).to.deep.equal({ test: false });
    });
  });

  describe('Number', () => {
    const Schema = Compactr.schema({ test: { type: 'number' } });

    it('should preserve number value and type', () => {
      expect(Schema.readContent(Schema.write({ test: 23.23 }).contentBuffer())).to.deep.equal({ test: 23.23 });
    });

    it('should preserve number value and type for negative values', () => {
      expect(Schema.readContent(Schema.write({ test: -23.23 }).contentBuffer())).to.deep.equal({ test: -23.23 });
    });
  });

  describe('String', () => {
    const Schema = Compactr.schema({ test: { type: 'string', size: 22 } });

    it('should preserve string value and type', () => {
      expect(Schema.readContent(Schema.write({ test: 'hello world' }).contentBuffer())).to.deep.equal({ test: 'hello world' });
    });
  });

  describe('Array', () => {
    const Schema = Compactr.schema({ test: { type: 'array', size: 12, items: { type: 'string' } } });

    it('should preserve array values and types', () => {
      expect(Schema.readContent(Schema.write({ test: ['a', 'b', 'c'] }).contentBuffer())).to.deep.equal({ test: ['a', 'b', 'c', '', '', ''] });
    });
  });

  describe('Schema', () => {
    const Schema = Compactr.schema({ test: { type: 'object', size: 20, schema: { test: { type: 'number' } } } });

    it('should preserve object values and types', () => {
      expect(Schema.readContent(Schema.write({ test: { test: 23.23 } }).contentBuffer())).to.deep.equal({ test: { test: 23.23 } });
    });
  });
});

describe('Data integrity - partial - multi simple', () => {
  describe('Booleans', () => {
    const Schema = Compactr.schema({ test: { type: 'boolean' }, test2: { type: 'boolean' } });

    it('should preserve boolean value and type - false', () => {
      expect(Schema.readContent(Schema.write({ test: false, test2: true }).contentBuffer())).to.deep.equal({ test: false, test2: true });
    });

    it('should skip null or undefined values', () => {
      expect(Schema.readContent(Schema.write({ test: null, test2: false }).contentBuffer())).to.deep.equal({ test: false, test2: false });
    });
  });

  describe('Numbers', () => {
    const Schema = Compactr.schema({ test: { type: 'number' }, test2: { type: 'number' } });

    it('should preserve number value and type', () => {
      expect(Schema.readContent(Schema.write({ test: 23.23, test2: -97.7 }).contentBuffer())).to.deep.equal({ test: 23.23, test2: -97.7 });
    });
  });

  describe('Strings', () => {
    const Schema = Compactr.schema({ test: { type: 'string', size: 22 }, test2: { type: 'string', size: 8 } });

    it('should preserve string value and type', () => {
      expect(Schema.readContent(Schema.write({ test: 'hello world', test2: 'écho' }).contentBuffer())).to.deep.equal({ test: 'hello world', test2: 'écho' });
    });
  });

  describe('Arrays', () => {
    const Schema = Compactr.schema({ test: { type: 'array', size: 9, items: { type: 'string' } }, test2: { type: 'array', size: 9, items: { type: 'string' } } });

    it('should preserve array values and types', () => {
      expect(Schema.readContent(Schema.write({ test: ['a', 'b', 'c'], test2: ['d', 'e', 'f'] }).contentBuffer())).to.deep.equal({ test: ['a', 'b', 'c'], test2: ['d', 'e', 'f'] });
    });
  });

  describe('Schemas', () => {
    const Schema = Compactr.schema({ test: { type: 'object', size: 11, schema: { test: { type: 'number' } } }, test2: { type: 'object', size: 11, schema: { test: { type: 'number' } } } });

    it('should preserve object values and types', () => {
      expect(Schema.readContent(Schema.write({ test: { test: 23.23 }, test2: { test: -97.7 } }).contentBuffer())).to.deep.equal({ test: { test: 23.23 }, test2: { test: -97.7 } });
    });
  });
});

describe('Data integrity - partial - multi mixed', () => {
  describe('Boolean + number + string + array + object', () => {
    const Schema = Compactr.schema({
      bool: { type: 'boolean' },
      num: { type: 'number' },
      str: { type: 'string', size: 22 },
      arr: { type: 'array', items: { type: 'string' }, size: 9 },
      obj: { type: 'object', size: 9, schema: { sub: { type: 'string' } } },
    });

    it('should preserve values and types', () => {
      expect(Schema.readContent(Schema.write({ bool: true, num: 23.23, str: 'hello world', arr: ['a', 'b', 'c'], obj: { sub: 'way' } }).contentBuffer())).to.deep.equal({ bool: true, num: 23.23, str: 'hello world', arr: ['a', 'b', 'c'], obj: { sub: 'way' } });
    });
  });
});