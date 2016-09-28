/**
 * Unit test suite
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const expect = require('chai').expect;

const Compactr = require('../src/');

const KEY_OVERHEAD = 2;

/* Tests ---------------------------------------------------------------------*/

describe('Data integrity', () => {
	describe('Booleans', () => {
		describe('String types', () => {
			const T = {t: 'boolean'};
			it('should preserve boolean value and type - true', () => {
				let val = true;
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
			});

			it('should preserve boolean value and type - false', () => {
				let val = true;
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
			});

			it('should skip null or undefined values', () => {
				let val = null;
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({});
			});

			it('should only take 1 byte', () => {
				let val = true;
				expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 1);
			});
		});
		describe('Function types', () => {
			const T = {t: Boolean};
			it('should preserve boolean value and type - true', () => {
				let val = true;
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
			});
		});
	});

	describe('Numbers', () => {
		describe('String types', () => {
			const T = {t: 'number'};
			describe('INT8', () => {
				it('should preserve integer value and type lowest', () => {
					let val = -128;
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should preserve integer value and type highest', () => {
					let val = 127
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should only take 1 byte', () => {
					let val = 0;
					expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 1);
				});

				it('should skip null or undefined values', () => {
					let val = null;
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({});
				});
			});

			describe('INT16', () => {
				it('should preserve integer value and type lowest', () => {
					let val = -32768;
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should preserve integer value and type highest', () => {
					let val = 32767;
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should only take 2 bytes', () => {
					let val = 32767;
					expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 2);
				});
			});

			describe('INT32', () => {
				it('should preserve integer value and type lowest', () => {
					let val = -2147483648;
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should preserve integer value and type highest', () => {
					let val = 2147483647;
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should only take 4 bytes', () => {
					let val = 2147483647;
					expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 4);
				});
			});

			describe('Double', () => {
				it('should preserve numeric value and type positive', () => {
					let val = 0.1;
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should preserve integer value and type negative', () => {
					let val = -3.5;
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should allow huge integers as well', () => {
					let val = 2147483648;
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should only take 8 bytes', () => {
					let val = 2147483648;
					expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 8);
				});
			});
		});
		describe('Function types', () => {
			const T = {t: Number};
			it('should preserve integer value and type', () => {
				let val = 2;
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
			});
		});
	});

	describe('Strings', () => {
		describe('String types', () => {
			const T = {t: 'string'};
			it('should preserve string value and type - true', () => {
				let val = 'The quick brown fox...';
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
			});

			it('should preserve special characters (utf8)', () => {
				let val = '\\/|!@#$%?&*()-_=+`^çàé<}{°~> .,è;[]';
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
			});

			it('should preserve Number characters', () => {
				let val = '0123456789';
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
			});

			it('should skip null or undefined values', () => {
				let val = null;
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({});
			});

			it('should only take 1 byte per character', () => {
				let val = 'This is a string';
				expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + val.length);
			});
		});
		describe('Function types', () => {
			const T = {t: String};
			it('should preserve boolean value and type - true', () => {
				let val = 'Function types test';
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
			});
		});
	});

	describe('Arrays', () => {
		describe('Array of Booleans', () => {
			describe('String types', () => {
				const T = {t: {
					type: 'json',
					items: 'boolean'
				}};
				it('should preserve boolean value and type - true/true', () => {
					let val = [true, true];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should preserve boolean value and type - true/false', () => {
					let val = [true, false];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should preserve boolean value and type - false/false', () => {
					let val = [false, false];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should coerce null or undefined values', () => {
					let val = [false, null];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:[false, false]});
				});

				it('should only take 1 byte', () => {
					let val = [true];
					expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 1);
				});

				it('should only take 2 bytes for 2 values', () => {
					let val = [true, false];
					expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 2);
				});
			});
			describe('Function types', () => {
				const T = {t: { 
					type: Array,
					items: Boolean
				}};
				it('should preserve boolean value and type - true', () => {
					let val = [true, false];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});
			});
		});

		describe('Numbers', () => {
			describe('String types', () => {
				const T = {t: {
					type: 'json',
					items: 'number'
				}};
				describe('INT8', () => {
					it('should preserve integer value and type lowest', () => {
						let val = [0, 2];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should preserve integer value and type zero', () => {
						let val = [0, 0];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should preserve integer value and type highest', () => {
						let val = [127, 127];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should only take 1 byte', () => {
						let val = [127];
						expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 3);
					});

					it('should only take 3 bytes for 2', () => {
						let val = [127, 12];
						expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 5);
					});

					it('should skip null or undefined values', () => {
						let val = [null, 32];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:[32]});
					});
				});

				describe('INT16', () => {
					it('should preserve integer value and type lowest', () => {
						let val = [-32768, 2];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should preserve integer value and type highest', () => {
						let val = [32767, -1];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should only take 2 bytes', () => {
						let val = [32767];
						expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 4);
					});
				});

				describe('INT32', () => {
					it('should preserve integer value and type lowest', () => {
						let val = [-2147483648, 2];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should preserve integer value and type highest', () => {
						let val = [2147483647, -1];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should only take 4 bytes', () => {
						let val = [2147483647];
						expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 6);
					});
				});

				describe('Double', () => {
					it('should preserve numeric value and type positive', () => {
						let val = [0.1, -2.22];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should preserve integer value and type negative', () => {
						let val = [-3.5, 1.11];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should allow huge integers as well', () => {
						let val = [2147483648, -2147483648.75];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should only take 8 bytes', () => {
						let val = [2147483648];
						expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 10);
					});
				});

				describe('Mix and match', () => {
					it('should preserve numeric value and type', () => {
						let val = [0.1, 1, 1111, 111111111];
						expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
					});

					it('should take the minimum byte allocation possible', () => {
						let val = [0.1, 1, 1111, 111111];
						expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + 20);
					});
				});
			});
			describe('Function types', () => {
				const T = {t: {
					type: Array,
					items: Number
				}};
				it('should preserve integer value and type', () => {
					let val = [2, 2.2];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});
			});
		});

		describe('Strings', () => {
			describe('String types', () => {
				const T = {t: {
					type: 'json',
					items: 'string'
				}};
				it('should preserve string value and type - true', () => {
					let val = ['The', 'quick', 'brown', 'fox...'];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should preserve special characters (utf8)', () => {
					let val = ['\\/|!@#$%?&*()-_=+`^çàé<}{°~> .,è;[]', 'second!'];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should preserve Number characters', () => {
					let val = ['01234', '56789'];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});

				it('should skip null or undefined values', () => {
					let val = [null, 'null'];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t: ['null']});
				});

				it('should only take 1 byte per character', () => {
					let val = ['This is a string', 'This is another string'];
					let len = val[0].length + val[1].length + val.length + 1;
					expect(Compactr.encode(T,{t:val}).length).to.be.eql(KEY_OVERHEAD + len);
				});
			});
			describe('Function types', () => {
				const T = {t: {
					type: Array,
					items: String
				}};
				it('should preserve string value and type', () => {
					let val = ['Function', 'types', 'test'];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});
			});
		});
		describe('Schemas', () => {
			describe('String types', () => {
				const T = {t: {
					type: 'json',
					items: {i: 'string'}
				}};
				it('should preserve object value and type', () => {
					let val = [{ i: 'I\'m nested!' }, { i: 'I am also nested!'}];
					expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
				});
			});
		});
	});

	describe('Schemas', () => {
		describe('String types', () => {
			const T = {t: {
				type: 'json',
				schema: {i: 'string'}
			}};
			it('should preserve object value and type', () => {
				let val = { i: 'I\'m nested!' };
				expect(Compactr.decode(T,Compactr.encode(T,{t:val}))).to.deep.equal({t:val});
			});
		});
	});

	describe('Binary', () => {
		describe('String types', () => {
			const T = {t:'buffer'};

			it('should preserve buffer constructor', () => {
				let val = Buffer.from(['a', 'b', 'c']);
				let res = Compactr.encode(T,{t:val});
				expect(res.length).to.equal(6); //Schema key, Size index, buffer value
				expect(Compactr.decode(T, res).t).to.be.instanceof(Buffer);
			});
		});
	});
});

describe('Data validation', () => {
	const T = {
		a: 'boolean',
		b: 'string',
		c: 'number'
	};

	it('should return [] on good data', () => {
		expect(Compactr.validate(T, {a: true, b: 'true', c:1}).length).to.equal(0);
	});

	it('should return warnings on bad data', () => {
		expect(Compactr.validate(T, {a: 'john', b: NaN, c:'smith'}).length).to.equal(3);
	});
});