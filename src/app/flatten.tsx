import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
import { flattenPdf } from '@/core/engine/flatten';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette } from '@/lib/brand';

export default function FlattenScreen() {
  const doc = useSingleDoc();
  const [fieldCount, setFieldCount] = React.useState<number | null>(null);

  async function run() {
    await doc.run(async (bytes) => {
      const res = await flattenPdf(bytes);
      setFieldCount(res.fieldCount);
      return { bytes: res.bytes, filename: 'flattened.pdf' };
    });
  }

  return (
    <SingleDocShell
      doc={doc}
      runLabel="Flatten form fields"
      onRun={run}
      runIcon="layers-outline"
      busyLabel="Flattening on your device…"
    >
      <Text style={styles.hint}>
        Bakes filled form fields into the page so they can no longer be edited: useful before
        sending a completed form. PDFs without a form are simply re-saved.
        {fieldCount !== null && fieldCount === 0 ? ' (No form fields were found in this PDF.)' : ''}
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  hint: { color: palette.muted, fontSize: 13, lineHeight: 19 },
});
