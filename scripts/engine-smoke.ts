// Smoke test: every vendored engine must run OUTSIDE a browser (plain Node,
// same as Hermes: no DOM, no canvas, no Workers). Run: npm run smoke

import { PDFDocument } from '@cantoo/pdf-lib';
import { merge, probe } from '../src/core/engine/merge';
import { organize } from '../src/core/engine/organize';
import { split } from '../src/core/engine/split';
import { watermarkText } from '../src/core/engine/watermark';
import { addPageNumbers } from '../src/core/engine/pageNumbers';
import { protect, unlock } from '../src/core/engine/protect';
import { readPdfMetadata, sanitizePdf } from '../src/core/engine/sanitize';
import { parseRanges } from '../src/lib/ranges';

let failures = 0;
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
  if (!ok) failures++;
}

async function makePdf(pages: number, label: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    doc.addPage([300, 400]).drawText(`${label} ${i + 1}`, { x: 20, y: 360, size: 18 });
  }
  return doc.save();
}

const isPdf = (b: Uint8Array) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;

async function main() {
  const a = await makePdf(2, 'A');
  const b = await makePdf(3, 'B');

  // merge + probe
  const merged = await merge([{ bytes: a.slice() }, { bytes: b.slice() }]);
  check('merge 2+3 -> 5 pages', (await probe(merged)).pageCount === 5 && isPdf(merged));

  // organize: reverse pages and rotate first
  const organized = await organize(b.slice(), [
    { index: 2, rotation: 90 },
    { index: 1, rotation: 0 },
    { index: 0, rotation: 0 },
  ]);
  check('organize reverse+rotate', (await probe(organized)).pageCount === 3 && isPdf(organized));

  // split by ranges
  const groups = parseRanges('1-2, 3', 3);
  const parts = await split(b.slice(), groups);
  check(
    'split "1-2, 3" -> 2 files',
    parts.length === 2 &&
      (await probe(parts[0].bytes)).pageCount === 2 &&
      (await probe(parts[1].bytes)).pageCount === 1,
  );

  // watermark
  const marked = await watermarkText(b.slice(), {
    text: 'CONFIDENTIAL',
    fontSize: 36,
    opacity: 0.3,
    angle: 45,
    color: { r: 1, g: 0, b: 0 },
    layout: 'diagonal',
  });
  check('watermarkText', isPdf(marked) && (await probe(marked)).pageCount === 3);

  // page numbers
  const numbered = await addPageNumbers(b.slice(), {
    position: 'bottom-center',
    fontSize: 10,
    margin: 24,
    color: { r: 0, g: 0, b: 0 },
    format: 'n-of-total',
    start: 1,
  });
  check('addPageNumbers', isPdf(numbered) && (await probe(numbered)).pageCount === 3);

  // protect + unlock round-trip (exercises AES + getRandomValues path)
  const locked = await protect(a.slice(), { userPassword: 'secret123' });
  const unlocked = await unlock(locked, 'secret123');
  check('protect->unlock round-trip', isPdf(unlocked) && (await probe(unlocked)).pageCount === 2);

  // metadata read + sanitize
  const meta = await readPdfMetadata(a.slice());
  const cleaned = await sanitizePdf(a.slice());
  check('readPdfMetadata + sanitizePdf', meta !== null && isPdf(cleaned));

  if (failures) {
    console.error(`\n${failures} engine(s) FAILED`);
    process.exit(1);
  }
  console.log('\nAll engines run without browser APIs.');
}

main().catch((e) => {
  console.error('FAIL:', e);
  process.exit(1);
});
