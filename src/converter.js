/** Type Coersion utilities */

/* Methods -------------------------------------------------------------------*/

/** @private */
function int8(value) {
  return Number(value) & 0xff;
}

/** @private */
function int16(value) {
  return Number(value) & 0xffff;
}

/** @private */
function int32(value) {
  return Number(value) & 0xffffffff;
}

/** @private */
function double(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? ret : 0;
}

/** @private */
function string(value) {
  return '' + value;
}

/** @private */
function boolean(value) {
  return !!value;
}

/** @private */
function object(value) {
  return (value.constructor === Object) ? value : {};
}

/** @private */
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
  object,
};
