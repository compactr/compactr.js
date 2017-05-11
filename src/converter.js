/** Type Coersion utilities */

'use strict';

/* Methods -------------------------------------------------------------------*/

function int8(value) {
  return Number(value) & 0xff;
}

function int16(value) {
  return Number(value) & 0xffff;
}

function int32(value) {
  return Number(value) & 0xffffffff;
}

function double(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? ret : 0;
}

function string(value) {
  return '' + value;
}

function boolean(value) {
  return !!value;
}

function object(value) {
  return (value.constructor === Object) ? value : {};
}

function array(value) {
  return (value.concat !== undefined) ? value : [value];
}

/* Exports -------------------------------------------------------------------*/

module.exports = {
  int8,
  int16,
  int32,
  number: double,
  double,
  string,
  char8: string,
  char16: string,
  char32: string,
  boolean,
  array,
  object
};