import * as React from 'react';
import { SingleDocShell } from '@/components/SingleDocShell';
import { Field, Segmented, TextField } from '@/components/ui';
import { watermarkText, type WatermarkLayout } from '@/core/engine/watermark';
import { useSingleDoc } from '@/lib/useSingleDoc';

type SizeChoice = 'S' | 'M' | 'L';
type StrengthChoice = 'light' | 'medium' | 'strong';

const SIZES: Record<SizeChoice, number> = { S: 28, M: 48, L: 72 };
const OPACITIES: Record<StrengthChoice, number> = { light: 0.15, medium: 0.3, strong: 0.5 };

export default function WatermarkScreen() {
  const doc = useSingleDoc();
  const [text, setText] = React.useState('CONFIDENTIAL');
  const [layout, setLayout] = React.useState<WatermarkLayout>('diagonal');
  const [size, setSize] = React.useState<SizeChoice>('M');
  const [strength, setStrength] = React.useState<StrengthChoice>('medium');

  async function run() {
    await doc.run(async (bytes) => ({
      bytes: await watermarkText(bytes, {
        text,
        fontSize: SIZES[size],
        opacity: OPACITIES[strength],
        angle: 45,
        color: { r: 1, g: 0, b: 0 },
        layout,
      }),
      filename: 'watermarked.pdf',
    }));
  }

  return (
    <SingleDocShell
      doc={doc}
      runLabel="Apply watermark"
      onRun={run}
      runDisabled={!text.trim()}
      busyLabel="Stamping on your device…"
    >
      <Field label="Watermark text">
        <TextField value={text} onChangeText={setText} maxLength={60} />
      </Field>
      <Field label="Layout">
        <Segmented<WatermarkLayout>
          value={layout}
          onChange={setLayout}
          options={[
            { id: 'diagonal', label: 'Diagonal' },
            { id: 'tile', label: 'Tiled' },
            { id: 'center', label: 'Center' },
          ]}
        />
      </Field>
      <Field label="Size">
        <Segmented<SizeChoice>
          value={size}
          onChange={setSize}
          options={[
            { id: 'S', label: 'Small' },
            { id: 'M', label: 'Medium' },
            { id: 'L', label: 'Large' },
          ]}
        />
      </Field>
      <Field label="Strength">
        <Segmented<StrengthChoice>
          value={strength}
          onChange={setStrength}
          options={[
            { id: 'light', label: 'Light' },
            { id: 'medium', label: 'Medium' },
            { id: 'strong', label: 'Strong' },
          ]}
        />
      </Field>
    </SingleDocShell>
  );
}
