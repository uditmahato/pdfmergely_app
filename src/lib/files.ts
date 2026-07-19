// File in/out for the PDF tools. Everything stays on-device: the document
// picker copies the chosen files into the app's private cache, the engine
// works on bytes in memory, and results are written back to the cache and
// handed to the OS share sheet. No network is involved anywhere.

import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export interface PickedPdf {
  /** Display name, e.g. "statement-march.pdf". */
  name: string;
  /** Size in bytes as reported by the picker (0 when unknown). */
  size: number;
  /** file:// URI of the private cached copy. */
  uri: string;
}

/**
 * Ask the user for one or more PDFs. Returns [] when the picker is dismissed.
 * copyToCacheDirectory gives us stable file:// URIs in the app sandbox, so
 * reads never depend on another app's content provider staying alive.
 */
export async function pickPdfs(multiple: boolean): Promise<PickedPdf[]> {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf',
    multiple,
    copyToCacheDirectory: true,
  });
  if (res.canceled) return [];
  return res.assets.map((a) => ({ name: a.name, size: a.size ?? 0, uri: a.uri }));
}

/** Read a picked file's raw bytes into memory. */
export async function readBytes(uri: string): Promise<Uint8Array> {
  return new File(uri).bytes();
}

/**
 * Write result bytes to the app cache and open the OS share sheet so the
 * user can save to Files/Drive, send to another app, or print. Returns the
 * cache URI (useful for tests / debugging).
 */
export async function shareResult(bytes: Uint8Array, filename: string): Promise<string> {
  const out = new File(Paths.cache, filename);
  // Overwrite any previous result of the same name (repeat runs).
  if (out.exists) out.delete();
  out.create();
  out.write(bytes);
  await Sharing.shareAsync(out.uri, {
    mimeType: 'application/pdf',
    dialogTitle: filename,
  });
  return out.uri;
}

/** Human-readable size, matching the web app's formatting. */
export function formatBytes(n: number): string {
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
