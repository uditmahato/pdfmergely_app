// Syncs the vendored PDF engine from the web repo (../pdfmergely). The engines
// under src/core are pure JS (no canvas/WASM/Worker APIs) and are the SAME
// files the website ships, so bug fixes land in one place and copy across.
//
// Usage: node scripts/sync-engine.mjs [--check]
//   --check  exit 1 if the vendored copies differ from the web repo (CI use)

import { copyFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(here, '..');
const webRoot = path.join(appRoot, '..', 'pdfmergely');

// Only list engines that run on Hermes: pure pdf-lib, no browser APIs.
// types.ts is NOT synced: the app keeps its own minimal subset.
const FILES = [
  'src/core/engine/merge.ts',
  'src/core/engine/organize.ts',
  'src/core/validation/magicBytes.ts',
];

if (!existsSync(webRoot)) {
  console.error(`web repo not found at ${webRoot}; clone it as a sibling of this repo.`);
  process.exit(1);
}

const check = process.argv.includes('--check');
let differs = 0;

for (const rel of FILES) {
  const src = path.join(webRoot, rel);
  const dst = path.join(appRoot, rel);
  if (!existsSync(src)) {
    console.error(`missing in web repo: ${rel}`);
    process.exit(1);
  }
  const same = existsSync(dst) && readFileSync(src, 'utf8') === readFileSync(dst, 'utf8');
  if (same) {
    console.log(`ok      ${rel}`);
  } else if (check) {
    console.log(`DIFFERS ${rel}`);
    differs++;
  } else {
    copyFileSync(src, dst);
    console.log(`synced  ${rel}`);
  }
}

if (check && differs) {
  console.error(`\n${differs} file(s) out of sync. Run: node scripts/sync-engine.mjs`);
  process.exit(1);
}
