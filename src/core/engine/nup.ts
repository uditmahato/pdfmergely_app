// N-up imposition: place multiple source pages onto each output page (2/4/6/9
// per sheet), or a fold-ready booklet (2-up with saddle-stitch page order).
// Vector content is preserved. Runs in the worker; nothing is uploaded.

import { PDFDocument, PDFEmbeddedPage } from '@cantoo/pdf-lib';
import { PdfError, type ProgressFn } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';

export type NUpLayout = '2' | '4' | '6' | '9' | 'booklet';

export interface NUpOptions {
  layout: NUpLayout;
}

const A4_PORTRAIT: [number, number] = [595.28, 841.89];
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const MARGIN = 16;
const GUTTER = 10;

const GRID: Record<Exclude<NUpLayout, 'booklet'>, { cols: number; rows: number; landscape: boolean }> = {
  '2': { cols: 2, rows: 1, landscape: true },
  '4': { cols: 2, rows: 2, landscape: false },
  '6': { cols: 2, rows: 3, landscape: false },
  '9': { cols: 3, rows: 3, landscape: false },
};

export async function nUpPdf(bytes: Uint8Array, opts: NUpOptions, onProgress?: ProgressFn): Promise<Uint8Array> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  let src: PDFDocument;
  try {
    src = await PDFDocument.load(bytes, { updateMetadata: false, password: '' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw /encrypt/i.test(msg) ? new PdfError('ENCRYPTED') : new PdfError('INVALID_PDF');
  }

  const out = await PDFDocument.create();
  const srcPages = src.getPages();
  const count = srcPages.length;
  if (count === 0) throw new PdfError('EMPTY_INPUT', 'This PDF has no pages.');

  // Embed pages one at a time: a blank/contentless page (which pdf-lib refuses
  // to embed) becomes null and is simply left out of its slot, instead of
  // failing the whole document.
  const embedded: (PDFEmbeddedPage | null)[] = [];
  for (const p of srcPages) {
    // pdf-lib cannot embed a page with no content stream (a truly blank page),
    // and that failure only surfaces later at save(), so detect and skip it now.
    if (!p.node.Contents()) {
      embedded.push(null);
      continue;
    }
    try {
      embedded.push(await out.embedPage(p));
    } catch {
      embedded.push(null);
    }
  }

  // Draw one embedded page scaled to fit a cell, centered.
  const place = (page: ReturnType<PDFDocument['addPage']>, ep: PDFEmbeddedPage, cx: number, cy: number, cw: number, ch: number) => {
    const s = Math.min(cw / ep.width, ch / ep.height);
    const w = ep.width * s;
    const h = ep.height * s;
    page.drawPage(ep, { x: cx + (cw - w) / 2, y: cy + (ch - h) / 2, xScale: s, yScale: s });
  };

  if (opts.layout === 'booklet') {
    // Pad to a multiple of 4, then order spreads for saddle-stitch folding:
    // [n,1], [2,n-1], [n-2,3], [4,n-3], ... Each spread is one landscape sheet side.
    let n = Math.ceil(count / 4) * 4;
    if (n === 0) n = 4;
    const order: number[] = [];
    let a = n;
    let b = 1;
    while (a > b) {
      order.push(a, b);
      a--;
      b++;
      order.push(b, a);
      a--;
      b++;
    }
    const [pw, ph] = A4_LANDSCAPE;
    const half = (pw - 2 * MARGIN - GUTTER) / 2;
    const cellH = ph - 2 * MARGIN;
    for (let i = 0; i < order.length; i += 2) {
      const page = out.addPage([pw, ph]);
      for (let side = 0; side < 2; side++) {
        const idx = order[i + side] - 1; // 1-based -> 0-based
        const ep = idx >= 0 && idx < count ? embedded[idx] : null; // null = blank padding
        if (ep) place(page, ep, MARGIN + side * (half + GUTTER), MARGIN, half, cellH);
      }
      onProgress?.((i + 2) / order.length);
    }
    return out.save();
  }

  const { cols, rows, landscape } = GRID[opts.layout];
  const [pw, ph] = landscape ? A4_LANDSCAPE : A4_PORTRAIT;
  const per = cols * rows;
  const cellW = (pw - 2 * MARGIN - (cols - 1) * GUTTER) / cols;
  const cellH = (ph - 2 * MARGIN - (rows - 1) * GUTTER) / rows;

  for (let i = 0; i < count; i += per) {
    const page = out.addPage([pw, ph]);
    for (let k = 0; k < per && i + k < count; k++) {
      const col = k % cols;
      const row = Math.floor(k / cols);
      const cellX = MARGIN + col * (cellW + GUTTER);
      // PDF origin is bottom-left; row 0 is the visual top row.
      const cellY = ph - MARGIN - (row + 1) * cellH - row * GUTTER;
      const ep = embedded[i + k];
      if (ep) place(page, ep, cellX, cellY, cellW, cellH);
    }
    onProgress?.(Math.min(1, (i + per) / count));
  }
  return out.save();
}
