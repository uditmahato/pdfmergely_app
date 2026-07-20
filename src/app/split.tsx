import * as React from 'react';
import { Alert, Text, StyleSheet } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
import { Field, TextField } from '@/components/ui';
import { split } from '@/core/engine/split';
import { parseRanges } from '@/lib/ranges';
import { shareResult } from '@/lib/files';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette } from '@/lib/brand';

export default function SplitScreen() {
  const doc = useSingleDoc();
  const [ranges, setRanges] = React.useState('');

  const groups = doc.pageCount ? parseRanges(ranges, doc.pageCount) : [];

  async function run() {
    await doc.run(async (bytes) => {
      const parts = await split(bytes, groups);
      // The share sheet handles one file at a time; share the first part
      // immediately and offer the rest one by one.
      for (let i = 1; i < parts.length; i++) {
        const p = parts[i];
        // Sequential prompts keep this simple; most splits are 1-3 parts.
        // eslint-disable-next-line no-await-in-loop
        await new Promise<void>((resolve) => {
          Alert.alert('Next file ready', p.name, [
            { text: 'Skip', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Share',
              onPress: () => {
                shareResult(p.bytes, p.name).finally(() => resolve());
              },
            },
          ]);
        });
      }
      return { bytes: parts[0].bytes, filename: parts[0].name };
    });
  }

  return (
    <SingleDocShell
      doc={doc}
      runLabel={`Split into ${groups.length || '…'} file${groups.length === 1 ? '' : 's'}`}
      onRun={run}
      runDisabled={groups.length === 0}
      busyLabel="Splitting on your device…"
    >
      <Field label={`Page ranges (1-${doc.pageCount})`}>
        <TextField
          value={ranges}
          onChangeText={setRanges}
          placeholder="e.g. 1-3, 5, 8-10"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Field>
      <Text style={styles.hint}>
        Each comma-separated range becomes its own PDF. Example: “1-3, 7” makes two files.
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
