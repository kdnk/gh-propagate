#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';

const version = process.env.npm_package_version;
if (!version) {
  console.error('npm_package_version environment variable not found');
  process.exit(1);
}

const src = readFileSync('src/index.ts', 'utf8');
const updated = src.replace(/\.version\('\d+\.\d+\.\d+'\)/, `.version('${version}')`);

writeFileSync('src/index.ts', updated);
console.log(`Updated commander version to ${version}`);