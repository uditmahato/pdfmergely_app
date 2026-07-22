// Scanned images -> one PDF, entirely in JS via pdf-lib. App-owned rather
// than vendored: the web repo's images tool leans on canvas for conversion,
// but the ML Kit scanner always hands us JPEGs, which pdf-lib embeds
// directly from bytes — no canvas, no native code, no upload.

import { PDFDocument } from '@cantoo/pdf-lib';
import { File } from 'expo-file-system';

/** Build a PDF from image file URIs (JPEG, or PNG as a fallback). */
export async function imagesToPdf(imageUris: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const uri of imageUris) {
    const bytes = await new File(uri).bytes();
    // JPEG magic: FF D8. The scanner emits JPEG; PNG covers stray imports.
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
    const image = isJpeg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  return doc.save();
}
