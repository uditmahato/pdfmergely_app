// Emulator screenshot helper (throwaway, dev-only). Usage:
//   node scripts/emu-shot.mjs launch          start the app fresh
//   node scripts/emu-shot.mjs shot <name>     screenshot -> shots/<name>.png
//   node scripts/emu-shot.mjs tap <x> <y>     tap at screen coords
//   node scripts/emu-shot.mjs back            press back

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ADB = path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const PKG = 'com.pdfmergely.app';

const [cmd, ...args] = process.argv.slice(2);

function adb(...a) {
  return execFileSync(ADB, a, { maxBuffer: 32 * 1024 * 1024 });
}

switch (cmd) {
  case 'launch': {
    adb('shell', 'am', 'force-stop', PKG);
    adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
    console.log('launched', PKG);
    break;
  }
  case 'shot': {
    const name = args[0] ?? 'shot';
    mkdirSync('shots', { recursive: true });
    const png = adb('exec-out', 'screencap', '-p');
    const file = path.join('shots', `${name}.png`);
    writeFileSync(file, png);
    console.log('saved', file, `${(png.length / 1024).toFixed(0)} KB`);
    break;
  }
  case 'tap': {
    adb('shell', 'input', 'tap', args[0], args[1]);
    console.log('tapped', args[0], args[1]);
    break;
  }
  case 'back': {
    adb('shell', 'input', 'keyevent', 'KEYCODE_BACK');
    console.log('back');
    break;
  }
  default:
    console.error('usage: emu-shot.mjs launch|shot <name>|tap <x> <y>|back');
    process.exit(1);
}
