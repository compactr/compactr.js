/**
 * Main module for Compactr
 */

'use strict';

/* Requires ------------------------------------------------------------------*/

const encode = require('./Encode');
const decode = require('./Decode');
const validate = require('./Validate');

/* Exports -------------------------------------------------------------------*/

module.exports = { encode, decode, validate };