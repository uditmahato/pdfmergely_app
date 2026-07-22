// Device automation helper (dev-only). Usage:
//   node scripts/emu-shot.mjs launch          start the app fresh
//   node scripts/emu-shot.mjs shot <name>     screenshot -> shots/<name>.png
//   node scripts/emu-shot.mjs tap <x> <y>     tap at screen coords
//   node scripts/emu-shot.mjs back            press back
//
// Target selection: ANDROID_SERIAL env var (defaults to the emulator).
//
// PHYSICAL-DEVICE GUARD: on anything that is not an emulator, every tap /
// shot / back first verifies that PDFMergely itself is the foreground app
// (text-only window query — no pixels read) and hard-aborts otherwise.
// A real phone can be showing banking, messages, anything; blind input or
// capture there is never acceptable. This actually happened once — the
// guard is not hypothetical.

import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ADB = path.join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const PKG = 'com.pdfmergely.app';
const SERIAL = process.env.ANDROID_SERIAL ?? 'emulator-5554';
const IS_EMULATOR = SERIAL.startsWith('emulator-');

const [cmd, ...args] = process.argv.slice(2);

function adb(...a) {
  return execFileSync(ADB, ['-s', SERIAL, ...a], { maxBuffer: 32 * 1024 * 1024 });
}

// Our app plus the system surfaces that belong to its flows: the ML Kit
// scanner activity (Play services), the document picker, and the share
// sheet. Anything else on a real phone — home screen, banking, messages —
// is out of bounds.
const ALLOWED_FOREGROUND = [
  PKG,
  'com.google.android.gms',
  'com.android.documentsui',
  'com.google.android.documentsui',
  'com.android.intentresolver',
];

/** Abort unless an allowed surface owns the physical device's screen. */
function assertOurAppForeground() {
  if (IS_EMULATOR) return;
  const out = adb('shell', 'dumpsys', 'window').toString();
  const line = out.split('\n').find((l) => l.includes('mCurrentFocus') || l.includes('mFocusedApp')) ?? '';
  if (!ALLOWED_FOREGROUND.some((p) => line.includes(p))) {
    console.error(`BLOCKED: foreground on ${SERIAL} is outside the app (${line.trim() || 'unknown'})`);
    console.error('Refusing to touch or capture a physical device outside our own app.');
    process.exit(2);
  }
}

switch (cmd) {
  case 'launch': {
    adb('shell', 'am', 'force-stop', PKG);
    adb('shell', 'monkey', '-p', PKG, '-c', 'android.intent.category.LAUNCHER', '1');
    console.log('launched', PKG, 'on', SERIAL);
    break;
  }
  case 'shot': {
    assertOurAppForeground();
    const name = args[0] ?? 'shot';
    mkdirSync('shots', { recursive: true });
    const png = adb('exec-out', 'screencap', '-p');
    const file = path.join('shots', `${name}.png`);
    writeFileSync(file, png);
    console.log('saved', file, `${(png.length / 1024).toFixed(0)} KB`);
    break;
  }
  case 'tap': {
    assertOurAppForeground();
    adb('shell', 'input', 'tap', args[0], args[1]);
    console.log('tapped', args[0], args[1]);
    break;
  }
  case 'back': {
    assertOurAppForeground();
    adb('shell', 'input', 'keyevent', 'KEYCODE_BACK');
    console.log('back');
    break;
  }
  default:
    console.error('usage: emu-shot.mjs launch|shot <name>|tap <x> <y>|back');
    process.exit(1);
}
