// Cheap structural validation BEFORE handing bytes to the parser.
// Defends our parsers against obviously-bogus input and gives fast user feedback.

const PDF_SIG = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

/**
 * Returns true if the buffer looks like a PDF: the "%PDF-" signature appears
 * within the first 1024 bytes (some valid files carry leading junk/BOM).
 */
export function isLikelyPdf(head: Uint8Array): boolean {
  const limit = Math.min(head.length, 1024) - PDF_SIG.length;
  for (let i = 0; i <= limit; i++) {
    let match = true;
    for (let j = 0; j < PDF_SIG.length; j++) {
      if (head[i + j] !== PDF_SIG[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}
