// Re-applies the Windows-local build fixes after `expo prebuild` regenerates
// android/ (which is gitignored). See README "Windows build fixes".
//   node scripts/apply-android-fixes.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const android = path.join(here, '..', 'android');
if (!existsSync(android)) {
  console.error('android/ not found; run `npx expo prebuild --platform android` first');
  process.exit(1);
}

// 1. ABI filter: emulator + modern phones only, halves native build time.
const gpPath = path.join(android, 'gradle.properties');
let gp = readFileSync(gpPath, 'utf8');
gp = gp.replace(/^reactNativeArchitectures=.*$/m, 'reactNativeArchitectures=x86_64,arm64-v8a');
writeFileSync(gpPath, gp);
console.log('gradle.properties: reactNativeArchitectures=x86_64,arm64-v8a');

// 2. CMake 3.31 override: default 3.22.1 loops with "build.ninja still dirty"
//    on Windows when compiling reanimated / expo-modules-core.
const sdk = (process.env.LOCALAPPDATA ?? '').replace(/\\/g, '/') + '/Android/Sdk';
const lpPath = path.join(android, 'local.properties');
const lines = [
  `sdk.dir=${sdk}`,
  `cmake.dir=${sdk}/cmake/3.31.0`,
];
writeFileSync(lpPath, lines.join('\n') + '\n');
console.log('local.properties: sdk.dir + cmake.dir(3.31.0)');
