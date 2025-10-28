/** Type Coersion utilities */

/* Methods ------------------------------------------------------------------- */

/** @private */

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

/* Exports ------------------------------------------------------------------- */

export default {
  int32,
  double,
  string,
  char8: string,
  char16: string,
  char32: string,
  boolean,
  array,
  object,
};
