#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { $ } from 'bun';

const version = process.env.npm_package_version;
if (!version) {
    console.error('npm_package_version environment variable not found');
    process.exit(1);
}

const src = readFileSync('src/constants/index.ts', 'utf8');
const updated = src.replace(/export const VERSION = '\d+\.\d+\.\d+';/, `export const VERSION = '${version}';`);

writeFileSync('src/constants/index.ts', updated);
console.log(`Updated VERSION constant to ${version}`);

// Add the updated file to git
await $`git add src/constants/index.ts`;
console.log('Added src/constants/index.ts to git');
