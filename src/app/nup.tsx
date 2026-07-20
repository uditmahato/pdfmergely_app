import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
import { Field, Segmented } from '@/components/ui';
import { nUpPdf, type NUpLayout } from '@/core/engine/nup';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette } from '@/lib/brand';

const SHEET_LABEL: Record<NUpLayout, string> = {
  '2': '2 pages per sheet',
  '4': '4 pages per sheet',
  '6': '6 pages per sheet',
  '9': '9 pages per sheet',
  booklet: 'Booklet order (print + fold)',
};

export default function NUpScreen() {
  const doc = useSingleDoc();
  const [layout, setLayout] = React.useState<NUpLayout>('2');

  async function run() {
    await doc.run(async (bytes) => ({
      bytes: await nUpPdf(bytes, { layout }),
      filename: 'n-up.pdf',
    }));
  }

  return (
    <SingleDocShell
      doc={doc}
      runLabel="Combine pages"
      onRun={run}
      runIcon="grid-outline"
      busyLabel="Laying out on your device…"
    >
      <Field label="Layout">
        <Segmented<NUpLayout>
          value={layout}
          onChange={setLayout}
          options={[
            { id: '2', label: '2-up' },
            { id: '4', label: '4-up' },
            { id: '6', label: '6-up' },
            { id: '9', label: '9-up' },
            { id: 'booklet', label: 'Booklet' },
          ]}
        />
      </Field>
      <Text style={styles.hint}>{SHEET_LABEL[layout]}. Saves paper when printing handouts or slides.</Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
