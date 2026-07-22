// Page thumbnails via the platform's native PDF renderer (PdfRenderer on
// Android, PDFKit on iOS) through react-native-pdf-thumbnail. Rendering is
// entirely on-device; thumbnails are written to the app cache as JPEGs.

import PdfThumbnail from 'react-native-pdf-thumbnail';

export interface PageThumb {
  uri: string;
  width: number;
  height: number;
}

/**
 * Render every page of a PDF to a thumbnail image. Returns [] on failure
 * (e.g. password-protected files), so callers degrade to number-only rows.
 */
export async function generateAllThumbs(fileUri: string, quality = 60): Promise<PageThumb[]> {
  try {
    return await PdfThumbnail.generateAllPages(fileUri, quality);
  } catch {
    return [];
  }
}

/** First-page thumbnail for library rows; null when rendering fails. */
export async function generateCoverThumb(fileUri: string, quality = 50): Promise<PageThumb | null> {
  try {
    return await PdfThumbnail.generate(fileUri, 0, quality);
  } catch {
    return null;
  }
}
