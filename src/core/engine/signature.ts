// Remove certificate-based (PKI) digital signatures from a PDF. Runs in the
// worker; the signed document is processed in memory and never sent anywhere,
// which matters here more than anywhere: signed files are usually contracts.
//
// What "remove" means: a digital signature lives in an AcroForm signature field
// (/FT /Sig) whose /V points at a signature dictionary (/ByteRange + PKCS#7
// /Contents), plus optional certification entries on the catalog (/Perms) and a
// PAdES validation store (/DSS). We delete the signature fields (and their page
// widgets), the certification dictionary and the validation store, then re-save
// the document as a fresh, non-incremental file. The output is a normal,
// unsigned PDF; the visible pages are untouched.
//
// This does NOT touch drawn/typed signature images placed on the page: those
// are page content, not signature fields (use Edit or Redact for them).

import { PDFDocument, PDFDict, PDFArray, PDFName, PDFRef, PDFString, PDFHexString } from '@cantoo/pdf-lib';
import { PdfError } from '../types';
import { isLikelyPdf } from '../validation/magicBytes';

export interface SignatureItem {
  /** The signature field's name (/T), e.g. "Signature1". */
  field: string;
  /** The signer's name from the signature dictionary (/Name), when recorded. */
  signer: string;
  /** Signing date (YYYY-MM-DD) parsed from /M, when recorded. */
  date: string;
  /** True when the field actually holds a signature (an unsigned placeholder otherwise). */
  signed: boolean;
}

export interface SignatureScan {
  signatures: SignatureItem[];
  /** True when the document carries a certification (DocMDP) or usage-rights seal. */
  certified: boolean;
}

export interface RemoveSignaturesResult {
  bytes: Uint8Array;
  /** Number of signature fields that were removed. */
  removed: number;
}

const N = PDFName.of;

async function load(bytes: Uint8Array): Promise<PDFDocument> {
  if (!isLikelyPdf(bytes)) throw new PdfError('INVALID_PDF');
  try {
    return await PDFDocument.load(bytes, { updateMetadata: false, password: '' });
  } catch {
    throw new PdfError('INVALID_PDF');
  }
}

function textOf(v: unknown): string {
  try {
    if (v instanceof PDFString || v instanceof PDFHexString) return v.decodeText();
  } catch {
    /* undecodable string */
  }
  return '';
}

/** Parse a PDF date string like D:20260101120000+00'00' to YYYY-MM-DD. */
function dateOf(raw: string): string {
  const m = /^D:(\d{4})(\d{2})?(\d{2})?/.exec(raw);
  return m ? `${m[1]}-${m[2] ?? '01'}-${m[3] ?? '01'}` : '';
}

interface FoundField {
  /** The field's own ref (null when it sits inline in the Fields array). */
  ref: PDFRef | null;
  dict: PDFDict;
  /** Every ref in the field's subtree (the field itself + widget kids). */
  refs: PDFRef[];
  item: SignatureItem;
}

/** Walk the AcroForm field tree collecting signature fields (FT is inheritable). */
function collectSigFields(doc: PDFDocument): { acroForm: PDFDict | null; found: FoundField[] } {
  const found: FoundField[] = [];
  const acroForm = doc.catalog.lookup(N('AcroForm'));
  if (!(acroForm instanceof PDFDict)) return { acroForm: null, found };
  const fields = acroForm.lookup(N('Fields'));
  if (!(fields instanceof PDFArray)) return { acroForm, found };

  const subtreeRefs = (ref: PDFRef | null, dict: PDFDict, out: PDFRef[]) => {
    if (ref) out.push(ref);
    const kids = dict.lookup(N('Kids'));
    if (kids instanceof PDFArray) {
      for (const el of kids.asArray()) {
        if (el instanceof PDFRef) {
          const kid = doc.context.lookup(el);
          if (kid instanceof PDFDict) subtreeRefs(el, kid, out);
        }
      }
    }
  };

  const visit = (el: unknown, inheritedFT: PDFName | null) => {
    const ref = el instanceof PDFRef ? el : null;
    const dict = ref ? doc.context.lookup(ref) : el;
    if (!(dict instanceof PDFDict)) return;
    const ftRaw = dict.lookup(N('FT'));
    const ft = ftRaw instanceof PDFName ? ftRaw : inheritedFT;
    const kids = dict.lookup(N('Kids'));

    if (ft === N('Sig')) {
      const refs: PDFRef[] = [];
      subtreeRefs(ref, dict, refs);
      const v = dict.lookup(N('V'));
      const sig = v instanceof PDFDict ? v : null;
      found.push({
        ref,
        dict,
        refs,
        item: {
          field: textOf(dict.lookup(N('T'))),
          signer: sig ? textOf(sig.lookup(N('Name'))) : '',
          date: sig ? dateOf(textOf(sig.lookup(N('M')))) : '',
          signed: sig !== null,
        },
      });
      return; // the whole subtree goes; no need to recurse further
    }
    if (kids instanceof PDFArray) for (const kid of kids.asArray()) visit(kid, ft);
  };

  for (const el of fields.asArray()) visit(el, null);
  return { acroForm, found };
}

function isCertified(doc: PDFDocument): boolean {
  return doc.catalog.has(N('Perms'));
}

/** List the digital signatures so the UI can show what is about to be removed. */
export async function readSignatures(bytes: Uint8Array): Promise<SignatureScan> {
  const doc = await load(bytes);
  const { found } = collectSigFields(doc);
  return { signatures: found.map((f) => f.item), certified: isCertified(doc) };
}

/** Delete every signature field, the certification seal and the validation store. */
export async function removeSignatures(bytes: Uint8Array): Promise<RemoveSignaturesResult> {
  const doc = await load(bytes);
  const { acroForm, found } = collectSigFields(doc);

  if (found.length > 0 && acroForm) {
    const drop = new Set<string>();
    const dropDicts = new Set<PDFDict>();
    for (const f of found) {
      for (const r of f.refs) drop.add(r.toString());
      dropDicts.add(f.dict);
    }
    const keep = (el: unknown) => {
      if (el instanceof PDFRef) {
        if (drop.has(el.toString())) return false;
        const d = doc.context.lookup(el);
        return !(d instanceof PDFDict && dropDicts.has(d));
      }
      return !(el instanceof PDFDict && dropDicts.has(el));
    };

    // Detach the widget annotations from every page.
    for (const page of doc.getPages()) {
      const annots = page.node.lookup(N('Annots'));
      if (!(annots instanceof PDFArray)) continue;
      const kept = annots.asArray().filter(keep);
      if (kept.length === annots.size()) continue;
      if (kept.length === 0) page.node.delete(N('Annots'));
      else page.node.set(N('Annots'), doc.context.obj(kept));
    }

    // Remove the fields from the AcroForm tree (top level and nested Kids).
    const prune = (arr: PDFArray) => {
      const kept = arr.asArray().filter(keep);
      for (const el of kept) {
        const d = el instanceof PDFRef ? doc.context.lookup(el) : el;
        if (d instanceof PDFDict) {
          const kids = d.lookup(N('Kids'));
          if (kids instanceof PDFArray) d.set(N('Kids'), prune(kids));
        }
      }
      return doc.context.obj(kept);
    };
    const fields = acroForm.lookup(N('Fields'));
    if (fields instanceof PDFArray) {
      const kept = prune(fields);
      if (kept.size() === 0) doc.catalog.delete(N('AcroForm'));
      else acroForm.set(N('Fields'), kept);
    }
    acroForm.delete(N('SigFlags'));
  }

  // The certification (DocMDP / usage-rights) seal and the PAdES validation
  // store reference the signatures; both go regardless of field count.
  doc.catalog.delete(N('Perms'));
  doc.catalog.delete(N('DSS'));

  // A full (non-incremental) save: the byte ranges any leftover incremental
  // signature pointed at no longer exist in the rewritten file.
  return { bytes: await doc.save(), removed: found.length };
}
