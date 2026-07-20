import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SingleDocShell } from '@/components/SingleDocShell';
import { readSignatures, removeSignatures, type SignatureScan } from '@/core/engine/signature';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette } from '@/lib/brand';

export default function SignatureScreen() {
  const doc = useSingleDoc();
  const [scan, setScan] = React.useState<SignatureScan | null>(null);

  // Scan for signature fields as soon as a document loads, so the user sees
  // what will be removed before committing.
  React.useEffect(() => {
    let cancelled = false;
    setScan(null);
    if (doc.bytes) {
      readSignatures(doc.bytes.slice())
        .then((s) => !cancelled && setScan(s))
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [doc.bytes]);

  async function run() {
    await doc.run(async (bytes) => {
      const res = await removeSignatures(bytes);
      return { bytes: res.bytes, filename: 'unsigned.pdf' };
    });
  }

  const count = scan?.signatures.length ?? 0;

  return (
    <SingleDocShell
      doc={doc}
      runLabel={count > 0 ? `Remove ${count} signature${count === 1 ? '' : 's'}` : 'Remove signatures'}
      onRun={run}
      runDisabled={scan !== null && count === 0 && !scan.certified}
      runIcon="shield-outline"
      busyLabel="Removing on your device…"
    >
      {scan && (
        <View style={styles.box}>
          <Ionicons
            name={count > 0 || scan.certified ? 'alert-circle' : 'checkmark-circle'}
            size={18}
            color={count > 0 || scan.certified ? '#fbbf24' : palette.brand}
          />
          <Text style={styles.boxText}>
            {count > 0
              ? `${count} digital signature${count === 1 ? '' : 's'} found${scan.certified ? ', and the document is certified' : ''}.`
              : scan.certified
                ? 'No signature fields, but the document carries a certification seal.'
                : 'No digital signatures found in this PDF.'}
          </Text>
        </View>
      )}
      <Text style={styles.hint}>
        Removes digital signature fields and certification seals so the PDF can be edited or
        re-signed. This does not alter the visible page content.
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: palette.surface2,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  boxText: { flex: 1, color: palette.foreground, fontSize: 13, lineHeight: 19 },
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
