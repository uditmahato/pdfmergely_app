// Resize / rescale pages to a standard size (A4, Letter, Legal). Vector content
// is preserved (text stays selectable): each page's content is scaled and the
// MediaBox is set to the target. Runs in the worker; nothing is uploaded.

import { PDFDocument } from '@cantoo/pdf-lib';
import { PdfError, type ProgressFn } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';

export type PageSizeName = 'A4' | 'LETTER' | 'LEGAL';

export interface ResizeOptions {
  size: PageSizeName;
  /** 'fit' scales content uniformly and centers it; 'stretch' fills exactly. */
  mode: 'fit' | 'stretch';
  /** 'auto' keeps each page's orientation; otherwise force portrait/landscape. */
  orientation: 'auto' | 'portrait' | 'landscape';
}

const DIMS: Record<PageSizeName, [number, number]> = {
  A4: [595.28, 841.89],
  LETTER: [612, 792],
  LEGAL: [612, 1008],
};

export async function resizePdf(bytes: Uint8Array, opts: ResizeOptions, onProgress?: ProgressFn): Promise<Uint8Array> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false, password: '' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw /encrypt/i.test(msg) ? new PdfError('ENCRYPTED') : new PdfError('INVALID_PDF');
  }

  const pages = doc.getPages();
  const n = pages.length;

  pages.forEach((page, i) => {
    const { width: w, height: h } = page.getSize();
    let [tw, th] = DIMS[opts.size];
    const wantLandscape = opts.orientation === 'landscape' || (opts.orientation === 'auto' && w > h);
    if (wantLandscape) [tw, th] = [th, tw];

    if (opts.mode === 'stretch') {
      page.scaleContent(tw / w, th / h);
      page.scaleAnnotations(tw / w, th / h);
    } else {
      const s = Math.min(tw / w, th / h);
      page.scaleContent(s, s);
      page.scaleAnnotations(s, s);
      // Center the scaled content within the new page box.
      page.translateContent((tw - w * s) / 2, (th - h * s) / 2);
    }
    page.setSize(tw, th);
    onProgress?.((i + 1) / n);
  });

  return doc.save({ useObjectStreams: true });
}
