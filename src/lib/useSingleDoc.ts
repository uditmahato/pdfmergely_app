// Shared lifecycle for single-document tools: pick one PDF into memory,
// probe its page count, run an engine function, share the result.
// Mirrors the web app's useSingleDoc hook, adapted to RN + expo-sharing.

import * as React from 'react';
import { probe } from '@/core/engine/merge';
import { PdfError } from '@/core/types';
import { pickPdfs, readBytes, shareResult, type PickedPdf } from '@/lib/files';

export interface SingleDocState {
  file: PickedPdf | null;
  bytes: Uint8Array | null;
  pageCount: number;
  busy: boolean;
  error: string | null;
  done: { filename: string; size: number } | null;
  pick: () => Promise<void>;
  run: (fn: (bytes: Uint8Array) => Promise<{ bytes: Uint8Array; filename: string }>) => Promise<void>;
  /** Re-open the share sheet for the last result (success-card action). */
  shareAgain: () => Promise<void>;
  reset: () => void;
}

function friendly(e: unknown): string {
  if (e instanceof PdfError) {
    if (e.code === 'ENCRYPTED') return 'This PDF is password-protected. Unlock it first.';
    if (e.code === 'WRONG_PASSWORD') return 'Wrong password. Please try again.';
    if (e.code === 'NOT_ENCRYPTED') return 'This PDF is not password-protected.';
    if (e.code === 'INVALID_PDF') return 'That file is not a valid PDF.';
  }
  return 'Something went wrong while processing. Please try again.';
}

export function useSingleDoc(): SingleDocState {
  const [file, setFile] = React.useState<PickedPdf | null>(null);
  const [bytes, setBytes] = React.useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<{ filename: string; size: number } | null>(null);
  // Kept out of state: only needed for the share-again action, never rendered.
  const resultRef = React.useRef<{ bytes: Uint8Array; filename: string } | null>(null);

  const pick = React.useCallback(async () => {
    setError(null);
    setDone(null);
    const picked = await pickPdfs(false);
    if (!picked.length) return;
    setBusy(true);
    try {
      const b = await readBytes(picked[0].uri);
      // probe() tolerates encrypted PDFs (ignoreEncryption), so protected
      // files can still be picked; the tool's engine decides what to allow.
      const meta = await probe(b.slice());
      setFile(picked[0]);
      setBytes(b);
      setPageCount(meta.pageCount);
    } catch (e) {
      setError(friendly(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const run = React.useCallback(
    async (fn: (bytes: Uint8Array) => Promise<{ bytes: Uint8Array; filename: string }>) => {
      if (!bytes) return;
      setBusy(true);
      setError(null);
      setDone(null);
      try {
        const out = await fn(bytes.slice());
        resultRef.current = out;
        setDone({ filename: out.filename, size: out.bytes.byteLength });
        await shareResult(out.bytes, out.filename);
      } catch (e) {
        setError(friendly(e));
      } finally {
        setBusy(false);
      }
    },
    [bytes],
  );

  const shareAgain = React.useCallback(async () => {
    const r = resultRef.current;
    if (r) await shareResult(r.bytes, r.filename);
  }, []);

  const reset = React.useCallback(() => {
    setFile(null);
    setBytes(null);
    setPageCount(0);
    setError(null);
    setDone(null);
    resultRef.current = null;
  }, []);

  return { file, bytes, pageCount, busy, error, done, pick, run, shareAgain, reset };
}
