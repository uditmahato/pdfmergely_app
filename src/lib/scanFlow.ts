// The scan pipeline, shared by the Docs tab and the post-scan screen's
// "Scan another": ML Kit scanner (on-device) -> JPEGs -> pdf-lib PDF ->
// local library entry. Returns null when the user cancels.

import DocumentScanner from 'react-native-document-scanner-plugin';
import { imagesToPdf } from '@/lib/imagesToPdf';
import { saveDoc, type DocEntry } from '@/lib/library';

function scanName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `Scan ${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}.${p(d.getMinutes())}.pdf`;
}

/** Run a full scan and save it to the library. Throws if the scanner is unavailable. */
export async function performScan(): Promise<DocEntry | null> {
  const res = await DocumentScanner.scanDocument({});
  const images = res.scannedImages ?? [];
  if (res.status !== 'success' || images.length === 0) return null; // cancelled
  const bytes = await imagesToPdf(images);
  return saveDoc(bytes, scanName(), { pages: images.length, source: 'scan' });
}
