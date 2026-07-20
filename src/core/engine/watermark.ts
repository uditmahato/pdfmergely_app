import { PDFDocument, StandardFonts, degrees, rgb } from '@cantoo/pdf-lib';
import { PdfError, type ProgressFn } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';

export interface Rgb {
  r: number; // 0..1
  g: number;
  b: number;
}

export type WatermarkLayout = 'tile' | 'diagonal' | 'center';

export interface TextWatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number; // 0..1
  angle: number; // degrees
  color: Rgb;
  layout: WatermarkLayout;
  /** 0-based page indices to stamp. Defaults to every page. */
  pages?: number[];
}

export interface ImageWatermarkOptions {
  image: Uint8Array;
  mime: 'image/png' | 'image/jpeg';
  scale: number; // fraction of page width, 0..1
  opacity: number; // 0..1
  layout: 'center' | 'tile';
  pages?: number[];
}

async function loadDoc(bytes: Uint8Array): Promise<PDFDocument> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false, password: '' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw /encrypt/i.test(msg) ? new PdfError('ENCRYPTED') : new PdfError('INVALID_PDF');
  }
}

function pageSet(total: number, pages?: number[]): Set<number> {
  if (!pages || !pages.length) return new Set(Array.from({ length: total }, (_, i) => i));
  return new Set(pages.filter((i) => i >= 0 && i < total));
}

// pdf-lib rotates drawText around the (x, y) anchor (the text's baseline-left),
// not around its visual centre. To place a rotated text block so that its
// VISUAL centre lands at (cx, cy), we offset (x, y) by the rotated half-width
// (along the baseline) and half-height (perpendicular to the baseline).
//
// halfH uses 0.36 * fontSize, an approximation of the visual mid-line of an
// uppercase Helvetica glyph above the baseline (cap height is ~0.72 em).
function centeredAnchor(cx: number, cy: number, textWidth: number, fontSize: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const halfW = textWidth / 2;
  const halfH = fontSize * 0.36;
  return {
    x: cx - halfW * cos + halfH * sin,
    y: cy - halfW * sin - halfH * cos,
  };
}

// Axis-aligned bounding box of a rotated text rectangle. Used to space tiles
// so the rotated stamps don't overlap (or leave huge gaps on shallow angles).
function rotatedBBox(textWidth: number, fontSize: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  const h = fontSize * 0.85; // ascender + small descender, in font units
  return {
    w: textWidth * cos + h * sin,
    h: textWidth * sin + h * cos,
  };
}

export async function watermarkText(
  bytes: Uint8Array,
  opts: TextWatermarkOptions,
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  if (!opts.text.trim()) throw new PdfError('EMPTY_INPUT', 'Watermark text is empty.');
  const doc = await loadDoc(bytes);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const targets = pageSet(pages.length, opts.pages);
  const color = rgb(opts.color.r, opts.color.g, opts.color.b);

  pages.forEach((page, i) => {
    if (!targets.has(i)) return;
    const { width, height } = page.getSize();
    const size = opts.fontSize;
    const textWidth = font.widthOfTextAtSize(opts.text, size);

    if (opts.layout === 'tile') {
      // Step by the rotated bounding box plus a gap, so tiles don't collide
      // when angle is non-zero. Anchor the grid on the page centre so the
      // pattern looks balanced instead of clipped at the bottom-left.
      const bbox = rotatedBBox(textWidth, size, opts.angle);
      const stepX = bbox.w + 60;
      const stepY = bbox.h + 60;
      const cx = width / 2;
      const cy = height / 2;
      const colsHalf = Math.ceil((width + stepX) / (2 * stepX));
      const rowsHalf = Math.ceil((height + stepY) / (2 * stepY));
      for (let r = -rowsHalf; r <= rowsHalf; r++) {
        for (let c = -colsHalf; c <= colsHalf; c++) {
          const { x, y } = centeredAnchor(cx + c * stepX, cy + r * stepY, textWidth, size, opts.angle);
          page.drawText(opts.text, {
            x, y, size, font, color, opacity: opts.opacity, rotate: degrees(opts.angle),
          });
        }
      }
    } else if (opts.layout === 'center') {
      // No rotation in 'center' mode; just centre the text.
      page.drawText(opts.text, {
        x: (width - textWidth) / 2,
        y: height / 2 - size * 0.36,
        size, font, color, opacity: opts.opacity,
      });
    } else {
      // Diagonal: one stamp through the page centre at the chosen angle.
      const angle = opts.angle || 45;
      const { x, y } = centeredAnchor(width / 2, height / 2, textWidth, size, angle);
      page.drawText(opts.text, {
        x, y, size, font, color, opacity: opts.opacity, rotate: degrees(angle),
      });
    }
    onProgress?.((i + 1) / pages.length);
  });

  return doc.save({ useObjectStreams: true });
}

export async function watermarkImage(
  bytes: Uint8Array,
  opts: ImageWatermarkOptions,
  onProgress?: ProgressFn,
): Promise<Uint8Array> {
  if (!opts.image?.length) throw new PdfError('EMPTY_INPUT', 'No watermark image provided.');
  const doc = await loadDoc(bytes);
  const img = opts.mime === 'image/png' ? await doc.embedPng(opts.image) : await doc.embedJpg(opts.image);
  const pages = doc.getPages();
  const targets = pageSet(pages.length, opts.pages);

  pages.forEach((page, i) => {
    if (!targets.has(i)) return;
    const { width, height } = page.getSize();
    const w = width * opts.scale;
    const h = (img.height / img.width) * w;

    if (opts.layout === 'tile') {
      // Anchor the tile grid on the page centre instead of (0, 0) so the
      // pattern looks balanced. Step by the cell + a small gap.
      const stepX = w + 40;
      const stepY = h + 40;
      const cx = width / 2;
      const cy = height / 2;
      const colsHalf = Math.ceil((width + stepX) / (2 * stepX));
      const rowsHalf = Math.ceil((height + stepY) / (2 * stepY));
      for (let r = -rowsHalf; r <= rowsHalf; r++) {
        for (let c = -colsHalf; c <= colsHalf; c++) {
          page.drawImage(img, {
            x: cx + c * stepX - w / 2,
            y: cy + r * stepY - h / 2,
            width: w, height: h, opacity: opts.opacity,
          });
        }
      }
    } else {
      page.drawImage(img, {
        x: (width - w) / 2,
        y: (height - h) / 2,
        width: w,
        height: h,
        opacity: opts.opacity,
      });
    }
    onProgress?.((i + 1) / pages.length);
  });

  return doc.save({ useObjectStreams: true });
}
