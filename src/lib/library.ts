// The local document library — the heart of the "everything stays in the
// app" promise. PDFs live in the app's PRIVATE documents directory and are
// indexed by a plain JSON file next to them. No database, no cloud, no
// network: the only way a document leaves is the user pressing Share.

import { Directory, File, Paths } from 'expo-file-system';

export type DocSource = 'import' | 'tool' | 'scan';

export interface DocEntry {
  id: string;
  /** Display name, e.g. "statement-march.pdf". */
  name: string;
  /** Filename on disk inside the docs directory (unique). */
  filename: string;
  createdAt: number;
  size: number;
  pages: number;
  source: DocSource;
}

const docsDir = new Directory(Paths.document, 'docs');
const indexFile = new File(docsDir, 'index.json');

function ensureDir() {
  if (!docsDir.exists) docsDir.create({ intermediates: true });
}

function readIndex(): DocEntry[] {
  ensureDir();
  try {
    if (!indexFile.exists) return [];
    const parsed = JSON.parse(indexFile.textSync()) as DocEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: DocEntry[]) {
  ensureDir();
  indexFile.write(JSON.stringify(entries));
}

/** Newest first. */
export function listDocs(): DocEntry[] {
  return readIndex().sort((a, b) => b.createdAt - a.createdAt);
}

export function getDoc(id: string): DocEntry | undefined {
  return readIndex().find((d) => d.id === id);
}

/** file:// URI for a library document. */
export function docUri(entry: DocEntry): string {
  return new File(docsDir, entry.filename).uri;
}

/** Copy bytes into the library and index them. Returns the new entry. */
export function saveDoc(
  bytes: Uint8Array,
  name: string,
  meta: { pages: number; source: DocSource },
): DocEntry {
  ensureDir();
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const safeName = name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`;
  const filename = `${id}.pdf`;
  const out = new File(docsDir, filename);
  out.create();
  out.write(bytes);
  const entry: DocEntry = {
    id,
    name: safeName,
    filename,
    createdAt: Date.now(),
    size: bytes.byteLength,
    pages: meta.pages,
    source: meta.source,
  };
  writeIndex([...readIndex(), entry]);
  return entry;
}

export function renameDoc(id: string, newName: string) {
  const safe = newName.trim();
  if (!safe) return;
  const entries = readIndex().map((d) =>
    d.id === id ? { ...d, name: safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf` } : d,
  );
  writeIndex(entries);
}

export function deleteDoc(id: string) {
  const entries = readIndex();
  const entry = entries.find((d) => d.id === id);
  if (entry) {
    try {
      const f = new File(docsDir, entry.filename);
      if (f.exists) f.delete();
    } catch {
      // Index removal below still hides it; orphan cleanup is harmless.
    }
  }
  writeIndex(entries.filter((d) => d.id !== id));
}
