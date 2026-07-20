import { PDFDocument } from '@cantoo/pdf-lib';
import { PdfError, type ProgressFn } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';

export interface SplitOutput {
  name: string;
  bytes: Uint8Array;
}

/**
 * Split a PDF into multiple documents. Each `group` is a list of 0-based page
 * indices that becomes one output file. The UI builds these groups from the
 * chosen mode (ranges, every-N, or single pages), keeping this primitive simple.
 */
export async function split(
  bytes: Uint8Array,
  groups: number[][],
  onProgress?: ProgressFn,
): Promise<SplitOutput[]> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  if (!groups.length) throw new PdfError('EMPTY_INPUT', 'Nothing to split.');

  let src: PDFDocument;
  try {
    src = await PDFDocument.load(bytes, { updateMetadata: false, password: '' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw /encrypt/i.test(msg) ? new PdfError('ENCRYPTED') : new PdfError('INVALID_PDF');
  }

  const total = src.getPageCount();
  const results: SplitOutput[] = [];

  for (let g = 0; g < groups.length; g++) {
    const indices = groups[g].filter((i) => i >= 0 && i < total);
    if (!indices.length) continue;

    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));

    const first = indices[0] + 1;
    const last = indices[indices.length - 1] + 1;
    const name = first === last ? `page_${first}.pdf` : `pages_${first}-${last}.pdf`;
    results.push({ name, bytes: await out.save({ useObjectStreams: true }) });

    onProgress?.((g + 1) / groups.length);
  }

  if (!results.length) throw new PdfError('EMPTY_INPUT', 'No valid pages to split.');
  return results;
}

/**
 * Split a PDF into parts that each stay at or under `targetBytes`. Pages are
 * added greedily and the part is saved/measured after each one; when the next
 * page would push it over the limit, the current part is closed and a new one
 * starts. A single page larger than the target becomes its own (oversized) part,
 * since it cannot be split further.
 */
export async function splitBySize(
  bytes: Uint8Array,
  targetBytes: number,
  onProgress?: ProgressFn,
): Promise<SplitOutput[]> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  if (!(targetBytes > 0)) throw new PdfError('EMPTY_INPUT', 'Target size must be greater than zero.');

  let src: PDFDocument;
  try {
    src = await PDFDocument.load(bytes, { updateMetadata: false, password: '' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw /encrypt/i.test(msg) ? new PdfError('ENCRYPTED') : new PdfError('INVALID_PDF');
  }

  const total = src.getPageCount();
  if (!total) throw new PdfError('EMPTY_INPUT', 'This PDF has no pages.');

  const build = async (indices: number[]): Promise<Uint8Array> => {
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));
    return out.save({ useObjectStreams: true });
  };
  const nameFor = (indices: number[]): string => {
    const first = indices[0] + 1;
    const last = indices[indices.length - 1] + 1;
    return first === last ? `page_${first}.pdf` : `pages_${first}-${last}.pdf`;
  };

  const results: SplitOutput[] = [];
  let part: number[] = [];
  let partBytes: Uint8Array | null = null; // saved bytes of `part` that fit

  for (let i = 0; i < total; i++) {
    const trial = [...part, i];
    const saved = await build(trial);
    if (saved.length > targetBytes && part.length > 0) {
      // Adding page i overflows; close the part we already had, start fresh.
      results.push({ name: nameFor(part), bytes: partBytes as Uint8Array });
      part = [i];
      partBytes = await build(part);
    } else {
      part = trial;
      partBytes = saved;
    }
    onProgress?.((i + 1) / total);
  }
  if (part.length) results.push({ name: nameFor(part), bytes: partBytes as Uint8Array });

  return results;
}
