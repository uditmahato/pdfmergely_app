import { PDFDocument, degrees } from '@cantoo/pdf-lib';
import { PdfError, type ProgressFn } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';

export interface PageOp {
  /** 0-based index of the page in the SOURCE document. */
  index: number;
  /** Rotation in degrees to ADD to the page's existing rotation (0/90/180/270). */
  rotation: number;
}

/**
 * Build a new PDF from a source by selecting, ordering and rotating its pages.
 *
 * This single primitive powers Reorder, Delete, Extract and Rotate, each of
 * those tools is just a different way of producing the `ops` list:
 *  - Reorder  → all pages, new order, rotation 0
 *  - Delete   → the kept pages, original order, rotation 0
 *  - Extract  → the selected pages
 *  - Rotate   → all pages, original order, per-page rotation
 */
export async function organize(
  bytes: Uint8Array,
  ops: PageOp[],
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  if (!ops.length) throw new PdfError('EMPTY_INPUT', 'No pages selected.');

  let src: PDFDocument;
  try {
    src = await PDFDocument.load(bytes, { updateMetadata: false, password: '' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw /encrypt/i.test(msg) ? new PdfError('ENCRYPTED') : new PdfError('INVALID_PDF');
  }

  const total = src.getPageCount();
  for (const op of ops) {
    if (op.index < 0 || op.index >= total) {
      throw new PdfError('UNKNOWN', `Page index ${op.index} out of range.`);
    }
  }

  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, ops.map((o) => o.index));

  copied.forEach((page, i) => {
    const rot = ((ops[i].rotation % 360) + 360) % 360;
    if (rot !== 0) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + rot) % 360));
    }
    out.addPage(page);
    onProgress?.((i + 1) / copied.length);
  });

  return out.save({ useObjectStreams: true });
}
