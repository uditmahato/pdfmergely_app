// Remove metadata and other identifying / auto-running content from a PDF before
// sharing. Runs in the worker; the file is processed in memory and never sent
// anywhere. Strips the Document Info dictionary (title, author, dates, producer,
// custom fields), the XMP metadata stream, and the catalog entries that carry
// JavaScript, embedded files and auto-run actions.

import { PDFDocument, PDFName, PDFDict } from '@cantoo/pdf-lib';
import { PdfError } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';

export interface PdfMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  hasXmp: boolean;
  hasJavaScript: boolean;
  hasEmbeddedFiles: boolean;
}

async function load(bytes: Uint8Array): Promise<PDFDocument> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false, password: '' });
  } catch {
    throw new PdfError('INVALID_PDF');
  }
}

/** Read the metadata so the UI can show exactly what is about to be removed. */
export async function readPdfMetadata(bytes: Uint8Array): Promise<PdfMetadata> {
  const doc = await load(bytes);
  const cat = doc.catalog;
  const hasXmp = cat.has(PDFName.of('Metadata'));
  let hasJavaScript = cat.has(PDFName.of('OpenAction')) || cat.has(PDFName.of('AA'));
  let hasEmbeddedFiles = false;
  try {
    const names = cat.lookup(PDFName.of('Names'));
    if (names instanceof PDFDict) {
      if (names.has(PDFName.of('JavaScript'))) hasJavaScript = true;
      if (names.has(PDFName.of('EmbeddedFiles'))) hasEmbeddedFiles = true;
    }
  } catch {
    /* no Names dict */
  }
  const str = (fn: () => string | undefined) => {
    try {
      return fn() ?? '';
    } catch {
      return '';
    }
  };
  const day = (d: Date | undefined) => {
    try {
      return d ? d.toISOString().slice(0, 10) : '';
    } catch {
      return '';
    }
  };
  return {
    title: str(() => doc.getTitle()),
    author: str(() => doc.getAuthor()),
    subject: str(() => doc.getSubject()),
    keywords: str(() => doc.getKeywords()),
    creator: str(() => doc.getCreator()),
    producer: str(() => doc.getProducer()),
    creationDate: day(doc.getCreationDate()),
    modificationDate: day(doc.getModificationDate()),
    hasXmp,
    hasJavaScript,
    hasEmbeddedFiles,
  };
}

/** Strip metadata, XMP, JavaScript, embedded files and auto-run actions. */
export async function sanitizePdf(bytes: Uint8Array): Promise<Uint8Array> {
  const doc = await load(bytes);

  // Wipe every Document Info entry (standard and custom).
  try {
    const infoRef = doc.context.trailerInfo.Info;
    if (infoRef) {
      const info = doc.context.lookup(infoRef);
      if (info instanceof PDFDict) for (const [key] of info.entries()) info.delete(key);
    }
  } catch {
    /* no Info dictionary */
  }

  // Remove the XMP metadata stream and anything that auto-runs or embeds a
  // payload: JavaScript and embedded files live under /Names; /OpenAction and
  // /AA can auto-run actions when the document opens.
  for (const key of ['Metadata', 'Names', 'OpenAction', 'AA']) {
    try {
      doc.catalog.delete(PDFName.of(key));
    } catch {
      /* key not present */
    }
  }

  // Loaded with updateMetadata:false, so pdf-lib never re-stamps Producer/ModDate;
  // the wiped Info dict and removed catalog entries persist in the saved bytes.
  return doc.save();
}
