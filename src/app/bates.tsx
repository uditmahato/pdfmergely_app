import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
import { Field, Segmented, TextField } from '@/components/ui';
import { addBatesNumbers } from '@/core/engine/bates';
import type { NumberPosition } from '@/core/engine/pageNumbers';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette, type } from '@/lib/brand';

type DigitsChoice = '4' | '6' | '8';

export default function BatesScreen() {
  const doc = useSingleDoc();
  const [prefix, setPrefix] = React.useState('CASE-');
  const [start, setStart] = React.useState('1');
  const [digits, setDigits] = React.useState<DigitsChoice>('6');
  const [position, setPosition] = React.useState<NumberPosition>('bottom-right');

  const startNum = Math.max(1, parseInt(start, 10) || 1);

  async function run() {
    await doc.run(async (bytes) => ({
      bytes: await addBatesNumbers(bytes, {
        prefix,
        suffix: '',
        start: startNum,
        digits: parseInt(digits, 10),
        position,
        fontSize: 9,
        margin: 24,
        color: { r: 0, g: 0, b: 0 },
      }),
      filename: 'bates.pdf',
    }));
  }

  const preview = `${prefix}${String(startNum).padStart(parseInt(digits, 10), '0')}`;

  return (
    <SingleDocShell
      doc={doc}
      runLabel="Stamp Bates numbers"
      onRun={run}
      runIcon="pricetag-outline"
      busyLabel="Stamping on your device…"
    >
      <Field label="Prefix">
        <TextField value={prefix} onChangeText={setPrefix} autoCapitalize="characters" maxLength={20} />
      </Field>
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Start at">
            <TextField value={start} onChangeText={setStart} keyboardType="number-pad" maxLength={7} />
          </Field>
        </View>
        <View style={styles.half}>
          <Field label="Digits">
            <Segmented<DigitsChoice>
              value={digits}
              onChange={setDigits}
              options={[
                { id: '4', label: '4' },
                { id: '6', label: '6' },
                { id: '8', label: '8' },
              ]}
            />
          </Field>
        </View>
      </View>
      <Field label="Position">
        <Segmented<NumberPosition>
          value={position}
          onChange={setPosition}
          options={[
            { id: 'bottom-left', label: 'Left' },
            { id: 'bottom-center', label: 'Center' },
            { id: 'bottom-right', label: 'Right' },
          ]}
        />
      </Field>
      <Text style={styles.preview}>
        First page will read: <Text style={styles.previewMono}>{preview}</Text>
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  preview: { color: palette.muted, fontSize: 13 },
  previewMono: { color: palette.brand, fontFamily: type.bold },
});
