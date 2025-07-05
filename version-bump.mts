#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { $ } from 'bun';

const version = process.env.npm_package_version;
if (!version) {
  console.error('npm_package_version environment variable not found');
  process.exit(1);
}

const src = readFileSync('src/index.ts', 'utf8');
const updated = src.replace(/\.version\('\d+\.\d+\.\d+'\)/, `.version('${version}')`);

writeFileSync('src/index.ts', updated);
console.log(`Updated commander version to ${version}`);

// Add the updated file to git
await $`git add src/index.ts`;
console.log('Added src/index.ts to git');