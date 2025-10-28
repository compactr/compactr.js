#!/usr/bin/env node
/** Benchmark runner script */

import { execSync } from 'child_process';

const benchmarks = [
  'array',
  'boolean',
  'double',
  'integer',
  'object',
  'string',
];

console.log('Running Compactr benchmarks...\n');

for (const benchmark of benchmarks) {
  console.log(`\n=== ${benchmark.toUpperCase()} BENCHMARK ===\n`);
  try {
    execSync(`node ./${benchmark}.ts`, { stdio: 'inherit' });
  }
  catch (error) {
    console.error(`Failed to run ${benchmark} benchmark:`, error);
  }
}

console.log('\nAll benchmarks completed!');
