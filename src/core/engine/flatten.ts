// Flatten interactive form fields so the filled values become part of the page
// and can no longer be edited. Runs in the worker; nothing is uploaded.

import { PDFDocument } from '@cantoo/pdf-lib';
import { PdfError } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';

export interface FlattenResult {
  bytes: Uint8Array;
  /** Number of form fields that were flattened (0 means there was no form). */
  fieldCount: number;
}

export async function flattenPdf(bytes: Uint8Array): Promise<FlattenResult> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { password: '' });
  } catch {
    throw new PdfError('INVALID_PDF');
  }

  let fieldCount = 0;
  try {
    const form = doc.getForm();
    fieldCount = form.getFields().length;
    if (fieldCount > 0) form.flatten();
  } catch {
    // No AcroForm (or an unflattenable widget); fall through and just re-save.
  }

  return { bytes: await doc.save(), fieldCount };
}
