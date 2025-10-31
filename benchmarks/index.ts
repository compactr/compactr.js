// Synthetic
import { init as array } from './array.ts';
import { init as boolean } from './boolean.ts';
import { init as integer } from './integer.ts';
import { init as schema } from './schema.ts';
import { init as string } from './string.ts';

// Realistic
import { init as jsonapiresponse } from './jsonapiresponse.ts';

import { sequence } from './utils.ts';

const benchmarks = [
  array,
  boolean,
  integer,
  schema,
  string,
  jsonapiresponse,
];

console.log('Running Compactr benchmarks...\n');

sequence(benchmarks, (i) => i().then((sizes) => console.log(sizes))).then(() => {
  console.log('\nAll benchmarks completed!');
});
