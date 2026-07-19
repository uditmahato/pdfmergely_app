// Framework-agnostic core types for the mobile app. This is a deliberate
// SUBSET of the web repo's src/core/types.ts: the app vendors only the
// engines that run on Hermes (pure pdf-lib, no canvas/WASM/Worker APIs),
// so the type surface stays small. Keep names and shapes identical to the
// web repo so engine files copy across without edits.

export interface SourceDocument {
  /** Raw PDF bytes. */
  bytes: Uint8Array;
  /** Optional subset + order of pages to include (0-based). Defaults to all, in order. */
  pageOrder?: number[];
}

export type ProgressFn = (progress: number) => void;

export interface PdfMeta {
  pageCount: number;
}

// Keep identical to the web repo's union so engine files copy across untouched.
export type PdfErrorCode =
  | 'INVALID_PDF'
  | 'ENCRYPTED'
  | 'WRONG_PASSWORD'
  | 'NOT_ENCRYPTED'
  | 'EMPTY_INPUT'
  | 'OUT_OF_MEMORY'
  | 'ENGINE_UNAVAILABLE'
  | 'UNKNOWN';

export class PdfError extends Error {
  code: PdfErrorCode;
  constructor(code: PdfErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'PdfError';
    this.code = code;
  }
}
