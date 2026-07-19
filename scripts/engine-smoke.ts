// Smoke test: the vendored engine must run OUTSIDE a browser (plain Node,
// same as Hermes: no DOM, no canvas, no Workers). Builds two small PDFs in
// memory, merges them, and asserts the output. Run: npm run smoke

import { PDFDocument } from '@cantoo/pdf-lib';
import { merge, probe } from '../src/core/engine/merge';

async function makePdf(pages: number, label: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    doc.addPage([300, 400]).drawText(`${label} ${i + 1}`, { x: 20, y: 360, size: 18 });
  }
  return doc.save();
}

async function main() {
  const a = await makePdf(2, 'A');
  const b = await makePdf(3, 'B');

  const out = await merge([{ bytes: a }, { bytes: b }]);
  const meta = await probe(out);

  if (meta.pageCount !== 5) {
    console.error(`FAIL: expected 5 pages, got ${meta.pageCount}`);
    process.exit(1);
  }
  if (out[0] !== 0x25 || out[1] !== 0x50 || out[2] !== 0x44 || out[3] !== 0x46) {
    console.error('FAIL: output does not start with %PDF');
    process.exit(1);
  }
  console.log(`PASS: merged 2+3 -> ${meta.pageCount} pages, ${out.byteLength} bytes, no browser APIs used`);
}

main().catch((e) => {
  console.error('FAIL:', e);
  process.exit(1);
});
