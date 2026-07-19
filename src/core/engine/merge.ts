import { PDFDocument } from '@cantoo/pdf-lib';
import { PdfError, type ProgressFn, type SourceDocument, type PdfMeta } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';

function classifyLoadError(err: unknown): PdfError {
  const msg = err instanceof Error ? err.message : String(err);
  // A real open-password fails the empty-password decrypt below with an
  // "incorrect password" / "encrypted" error; report it as password-protected
  // (unlock it first) rather than "invalid".
  if (/encrypt|password/i.test(msg)) {
    return new PdfError('ENCRYPTED', 'This PDF is password-protected. Unlock it first.');
  }
  return new PdfError('INVALID_PDF', 'This file is not a valid PDF.');
}

/** Read page count without retaining the parsed document. */
export async function probe(bytes: Uint8Array): Promise<PdfMeta> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  try {
    // ignoreEncryption (not password: '') so we can report a page count for ANY
    // encrypted file, including one that needs a real open-password: the Unlock
    // tool must still be able to accept it. Only the count is needed here, not
    // the decrypted content, so we do not attempt decryption.
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    return { pageCount: doc.getPageCount() };
  } catch (err) {
    throw classifyLoadError(err);
  }
}

/**
 * Merge multiple PDFs in order into a single document.
 *
 * Memory discipline: each source is loaded, copied, then dropped before the next.
 * Peak memory ≈ largest single source + the growing output, NOT the sum of all inputs.
 */
export async function merge(
  sources: SourceDocument[],
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  if (!sources.length) throw new PdfError('EMPTY_INPUT', 'No files to merge.');

  const out = await PDFDocument.create();

  for (let i = 0; i < sources.length; i++) {
    const { bytes, pageOrder } = sources[i];
    if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');

    let src: PDFDocument;
    try {
      // Many official PDFs (government forms, bank statements, the Spanish
      // "referencia catastral" from the bug report) are "permissions" encrypted
      // with an empty user password: they open in any viewer, but pdf-lib refuses
      // them by default. Loading with password: '' actually DECRYPTS the content
      // streams (ignoreEncryption only skips the check and leaves them encrypted,
      // producing blank pages), so the pages merge with their real content. A PDF
      // that truly needs a password fails here and is reported as ENCRYPTED.
      src = await PDFDocument.load(bytes, { updateMetadata: false, password: '' });
    } catch (err) {
      throw classifyLoadError(err);
    }

    const indices = pageOrder ?? src.getPageIndices();
    const copied = await out.copyPages(src, indices);
    copied.forEach((page) => out.addPage(page));

    // Drop the reference so the GC can reclaim this source before the next load.
    (sources[i] as { bytes?: Uint8Array }).bytes = undefined;

    onProgress?.((i + 1) / sources.length);
  }

  // useObjectStreams produces a smaller output with lower peak memory.
  return out.save({ useObjectStreams: true });
}
