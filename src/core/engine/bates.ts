// Bates numbering: stamp a sequential identifier (prefix + zero-padded number +
// suffix) on every page, the standard for legal and business document sets.
// Mirrors the page-numbers engine's positioning; runs in the worker, no upload.

import { PDFDocument, StandardFonts, rgb } from '@cantoo/pdf-lib';
import { PdfError, type ProgressFn } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';
import type { Rgb } from './watermark';
import type { NumberPosition } from './pageNumbers';

export interface BatesOptions {
  prefix: string;
  suffix: string;
  /** Number printed on the first page. */
  start: number;
  /** Zero-pad the number to this many digits (e.g. 6 -> 000123). */
  digits: number;
  position: NumberPosition;
  fontSize: number;
  margin: number;
  color: Rgb;
}

/** Build the stamp for a given page index (0-based). Exported for the live preview. */
export function batesLabel(opts: Pick<BatesOptions, 'prefix' | 'suffix' | 'start' | 'digits'>, pageIndex: number): string {
  const seq = String(opts.start + pageIndex).padStart(Math.max(1, opts.digits), '0');
  return `${opts.prefix}${seq}${opts.suffix}`;
}

export async function addBatesNumbers(
  bytes: Uint8Array,
  opts: BatesOptions,
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false, password: '' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw /encrypt/i.test(msg) ? new PdfError('ENCRYPTED') : new PdfError('INVALID_PDF');
  }

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const color = rgb(opts.color.r, opts.color.g, opts.color.b);
  const pages = doc.getPages();
  const n = pages.length;

  pages.forEach((page, i) => {
    const text = batesLabel(opts, i);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, opts.fontSize);
    const m = opts.margin;
    let x: number;
    if (opts.position.endsWith('center')) x = (width - textWidth) / 2;
    else if (opts.position.endsWith('right')) x = width - m - textWidth;
    else x = m;
    const y = opts.position.startsWith('top') ? height - m - opts.fontSize : m;
    page.drawText(text, { x, y, size: opts.fontSize, font, color });
    onProgress?.((i + 1) / n);
  });

  return doc.save({ useObjectStreams: true });
}
