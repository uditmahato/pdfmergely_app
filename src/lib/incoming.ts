// In-memory stash for PDFs shared INTO the app via the Android share sheet
// ("Share -> PDFMergely"). Mirrors the web app's handoff module: module state
// only, nothing persisted, consumed once. The share-intent module has already
// copied the files into app-private storage, so `uri` is a local file path.

import type { PickedPdf } from '@/lib/files';

let stash: PickedPdf[] | null = null;

export function stashIncoming(files: PickedPdf[]): void {
  stash = files.length ? files : null;
}

/** Consume all shared files (multi-file tools, e.g. Merge). */
export function takeIncomingAll(): PickedPdf[] {
  const files = stash ?? [];
  stash = null;
  return files;
}

/** Consume a single shared file (single-doc tools). */
export function takeIncomingSingle(): PickedPdf | null {
  const file = stash?.[0] ?? null;
  stash = null;
  return file;
}

export function peekIncomingCount(): number {
  return stash?.length ?? 0;
}
