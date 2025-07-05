#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const src = readFileSync('src/index.ts', 'utf8');

const updated = src.replace(/\.version\('\d+\.\d+\.\d+'\)/, `.version('${pkg.version}')`);

writeFileSync('src/index.ts', updated);
console.log(`Updated commander version to ${pkg.version}`);