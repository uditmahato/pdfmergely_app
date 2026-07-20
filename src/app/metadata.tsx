import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
import { readPdfMetadata, sanitizePdf, type PdfMetadata } from '@/core/engine/sanitize';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette } from '@/lib/brand';

export default function MetadataScreen() {
  const doc = useSingleDoc();
  const [meta, setMeta] = React.useState<PdfMetadata | null>(null);

  // Read metadata as soon as a document is loaded, so the user sees exactly
  // what will be removed before committing.
  React.useEffect(() => {
    let cancelled = false;
    setMeta(null);
    if (doc.bytes) {
      readPdfMetadata(doc.bytes.slice())
        .then((m) => !cancelled && setMeta(m))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [doc.bytes]);

  async function run() {
    await doc.run(async (bytes) => ({
      bytes: await sanitizePdf(bytes),
      filename: 'sanitized.pdf',
    }));
  }

  const fields: Array<[string, string]> = meta
    ? ([
        ['Title', meta.title],
        ['Author', meta.author],
        ['Subject', meta.subject],
        ['Keywords', meta.keywords],
        ['Creator app', meta.creator],
        ['Producer', meta.producer],
        ['Created', meta.creationDate],
        ['Modified', meta.modificationDate],
      ].filter(([, v]) => v) as Array<[string, string]>)
    : [];

  return (
    <SingleDocShell
      doc={doc}
      runLabel="Remove metadata"
      onRun={run}
      busyLabel="Cleaning on your device…"
    >
      {meta && (
        <View style={styles.box}>
          <Text style={styles.boxTitle}>What this PDF reveals</Text>
          {fields.length === 0 && !meta.hasXmp ? (
            <Text style={styles.empty}>No document metadata found.</Text>
          ) : (
            fields.map(([k, v]) => (
              <View key={k} style={styles.row}>
                <Text style={styles.key}>{k}</Text>
                <Text style={styles.val} numberOfLines={2}>
                  {v}
                </Text>
              </View>
            ))
          )}
          {meta.hasXmp && <Text style={styles.flag}>Contains an XMP metadata stream</Text>}
          {meta.hasJavaScript && <Text style={styles.flag}>Contains embedded JavaScript</Text>}
          {meta.hasEmbeddedFiles && <Text style={styles.flag}>Contains embedded files</Text>}
        </View>
      )}
      <Text style={styles.hint}>
        Removes the info dictionary, XMP metadata, embedded JavaScript and attached files. The
        pages themselves are untouched.
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  boxTitle: { color: palette.foreground, fontWeight: '700', fontSize: 14 },
  empty: { color: palette.muted, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10 },
  key: { color: palette.muted, fontSize: 13, width: 96 },
  val: { color: palette.foreground, fontSize: 13, flex: 1 },
  flag: { color: palette.danger, fontSize: 13 },
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
