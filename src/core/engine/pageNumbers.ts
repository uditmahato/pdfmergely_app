import { PDFDocument, StandardFonts, rgb } from '@cantoo/pdf-lib';
import { PdfError, type ProgressFn } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';
import type { Rgb } from './watermark';

export type NumberFormat = 'n' | 'page-n' | 'n-of-total' | 'roman';
export type NumberPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

/** A run of pages with its own numbering, for multi-section documents. */
export interface PageNumberSection {
  /** 1-based first page of the section (inclusive). */
  from: number;
  /** 1-based last page of the section (inclusive). */
  to: number;
  format: NumberFormat;
  /** Number printed on the section's first page. */
  start: number;
}

export interface PageNumberOptions {
  position: NumberPosition;
  fontSize: number;
  margin: number;
  color: Rgb;
  // Single mode: one numbering across the document.
  format?: NumberFormat;
  /** Number printed on the first numbered page. */
  start?: number;
  /** 0-based page indices that should receive a number. Defaults to all. */
  pages?: number[];
  // Multi-section mode (takes precedence when present): each section has its own
  // range, format and start. Pages in no section get no number.
  sections?: PageNumberSection[];
  /** Never number the first page (e.g. a cover), even if a section covers it. */
  skipFirst?: boolean;
}

function toRoman(num: number): string {
  if (num <= 0) return String(num);
  const map: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'],
    [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'],
    [5, 'v'], [4, 'iv'], [1, 'i'],
  ];
  let n = num;
  let out = '';
  for (const [value, sym] of map) {
    while (n >= value) {
      out += sym;
      n -= value;
    }
  }
  return out;
}

function label(format: NumberFormat, n: number, total: number): string {
  switch (format) {
    case 'page-n':
      return `Page ${n}`;
    case 'n-of-total':
      return `${n} of ${total}`;
    case 'roman':
      return toRoman(n);
    default:
      return String(n);
  }
}

export async function addPageNumbers(
  bytes: Uint8Array,
  opts: PageNumberOptions,
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
  const pages = doc.getPages();
  const n = pages.length;

  // The text printed on each page (null = leave that page unnumbered).
  const texts: (string | null)[] = new Array(n).fill(null);
  if (opts.sections?.length) {
    for (let i = 0; i < n; i++) {
      if (opts.skipFirst && i === 0) continue;
      const pageNo = i + 1; // 1-based
      const sec = opts.sections.find((s) => pageNo >= s.from && pageNo <= s.to);
      if (sec) texts[i] = label(sec.format, sec.start + (pageNo - sec.from), sec.start + (sec.to - sec.from));
    }
  } else {
    const start = opts.start ?? 1;
    const format = opts.format ?? 'n';
    let target = opts.pages?.length ? opts.pages.filter((i) => i >= 0 && i < n) : pages.map((_, i) => i);
    if (opts.skipFirst) target = target.filter((i) => i !== 0);
    const total = target.length;
    target.forEach((pageIndex, ordinal) => {
      texts[pageIndex] = label(format, start + ordinal, start + total - 1);
    });
  }

  const color = rgb(opts.color.r, opts.color.g, opts.color.b);
  pages.forEach((page, i) => {
    const text = texts[i];
    if (text) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, opts.fontSize);
      const m = opts.margin;
      let x: number;
      if (opts.position.endsWith('center')) x = (width - textWidth) / 2;
      else if (opts.position.endsWith('right')) x = width - m - textWidth;
      else x = m;
      const y = opts.position.startsWith('top') ? height - m - opts.fontSize : m;
      page.drawText(text, { x, y, size: opts.fontSize, font, color });
    }
    onProgress?.((i + 1) / n);
  });

  return doc.save({ useObjectStreams: true });
}
