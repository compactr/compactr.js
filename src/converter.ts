/** Type Coersion utilities */

/* Methods ------------------------------------------------------------------- */

/** @private */

/** @private */
function int32(value) {
  return Number(value) & 0xffffffff;
}

/** @private */
function float(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? ret : 0;
}

/** @private */
function double(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? ret : 0;
}

/** @private */
function int64(value) {
  const ret = Number(value);
  return (Number.isFinite(ret)) ? Math.trunc(ret) : 0;
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
  int64,
  float,
  double,
  string,
  char8: string,
  char16: string,
  char32: string,
  boolean,
  array,
  object,
};
