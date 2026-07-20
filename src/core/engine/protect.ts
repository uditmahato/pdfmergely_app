// Password protection + removal. Uses @cantoo/pdf-lib (a pdf-lib superset that
// adds AES encryption). Runs in the worker; passwords live only in worker memory
// and are never logged, persisted, or transmitted.

import { PDFDocument } from '@cantoo/pdf-lib';
import { PdfError } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';

export interface ProtectOptions {
  /** Open password, required to view the document. */
  userPassword: string;
  /**
   * Permissions (owner) password. If omitted we generate a random one, so the
   * permission flags below actually bind: when owner == user, any viewer that
   * lets the user open the file also grants full owner rights and ignores the
   * restrictions. The user never needs this password; unlocking only needs the
   * open password.
   */
  ownerPassword?: string;
  permissions?: {
    printing?: 'highResolution' | 'lowResolution' | false;
    copying?: boolean;
    modifying?: boolean;
  };
}

/** A strong random owner password the user never needs to know. */
function randomOwnerPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function isEncryptedError(err: unknown): boolean {
  const name = err instanceof Error ? err.constructor.name : '';
  const msg = err instanceof Error ? err.message : String(err);
  return /encrypt/i.test(name) || /encrypt|password/i.test(msg);
}

/** Encrypt a PDF with a password. Rejects if the input is already encrypted. */
export async function protect(bytes: Uint8Array, opts: ProtectOptions): Promise<Uint8Array> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  if (!opts.userPassword) throw new PdfError('EMPTY_INPUT', 'Password is empty.');

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if (isEncryptedError(err)) throw new PdfError('ENCRYPTED', 'This PDF is already protected.');
    throw new PdfError('INVALID_PDF');
  }

  doc.encrypt({
    userPassword: opts.userPassword,
    ownerPassword: opts.ownerPassword || randomOwnerPassword(),
    permissions: opts.permissions ?? {},
  });

  // Encryption is incompatible with object streams.
  return doc.save({ useObjectStreams: false });
}

/**
 * Remove protection using the correct user-supplied password. We only decrypt
 * documents the user can already open, we never crack or bypass passwords.
 */
export async function unlock(bytes: Uint8Array, password: string): Promise<Uint8Array> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');

  // Detect whether the document is actually encrypted.
  let encrypted = false;
  try {
    await PDFDocument.load(bytes);
  } catch (err) {
    if (isEncryptedError(err)) encrypted = true;
    else throw new PdfError('INVALID_PDF');
  }
  if (!encrypted) throw new PdfError('NOT_ENCRYPTED', 'This PDF is not password-protected.');

  if (!password) throw new PdfError('WRONG_PASSWORD', 'Enter the document password.');

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { password });
  } catch {
    throw new PdfError('WRONG_PASSWORD', 'Incorrect password.');
  }

  return doc.save({ useObjectStreams: false });
}
