import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
import { Field, Segmented } from '@/components/ui';
import { resizePdf, type PageSizeName } from '@/core/engine/resize';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette } from '@/lib/brand';

type Mode = 'fit' | 'stretch';
type Orientation = 'auto' | 'portrait' | 'landscape';

export default function ResizeScreen() {
  const doc = useSingleDoc();
  const [size, setSize] = React.useState<PageSizeName>('A4');
  const [mode, setMode] = React.useState<Mode>('fit');
  const [orientation, setOrientation] = React.useState<Orientation>('auto');

  async function run() {
    await doc.run(async (bytes) => ({
      bytes: await resizePdf(bytes, { size, mode, orientation }),
      filename: 'resized.pdf',
    }));
  }

  return (
    <SingleDocShell
      doc={doc}
      runLabel={`Resize to ${size}`}
      onRun={run}
      runIcon="resize-outline"
      busyLabel="Resizing on your device…"
    >
      <Field label="Page size">
        <Segmented<PageSizeName>
          value={size}
          onChange={setSize}
          options={[
            { id: 'A4', label: 'A4' },
            { id: 'LETTER', label: 'Letter' },
            { id: 'LEGAL', label: 'Legal' },
          ]}
        />
      </Field>
      <Field label="Content">
        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { id: 'fit', label: 'Fit (keep shape)' },
            { id: 'stretch', label: 'Stretch' },
          ]}
        />
      </Field>
      <Field label="Orientation">
        <Segmented<Orientation>
          value={orientation}
          onChange={setOrientation}
          options={[
            { id: 'auto', label: 'Auto' },
            { id: 'portrait', label: 'Portrait' },
            { id: 'landscape', label: 'Landscape' },
          ]}
        />
      </Field>
      <Text style={styles.hint}>
        Fit scales each page uniformly and centers it on the new size; Stretch fills the page
        exactly and may distort content.
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
