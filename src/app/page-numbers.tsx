import * as React from 'react';
import { SingleDocShell } from '@/components/SingleDocShell';
import { Field, Segmented } from '@/components/ui';
import {
  addPageNumbers,
  type NumberFormat,
  type NumberPosition,
} from '@/core/engine/pageNumbers';
import { useSingleDoc } from '@/lib/useSingleDoc';

export default function PageNumbersScreen() {
  const doc = useSingleDoc();
  const [position, setPosition] = React.useState<NumberPosition>('bottom-center');
  const [format, setFormat] = React.useState<NumberFormat>('n');

  async function run() {
    await doc.run(async (bytes) => ({
      bytes: await addPageNumbers(bytes, {
        position,
        fontSize: 11,
        margin: 28,
        color: { r: 0, g: 0, b: 0 },
        format,
        start: 1,
      }),
      filename: 'numbered.pdf',
    }));
  }

  return (
    <SingleDocShell
      doc={doc}
      runLabel="Add page numbers"
      onRun={run}
      busyLabel="Numbering on your device…"
    >
      <Field label="Position">
        <Segmented<NumberPosition>
          value={position}
          onChange={setPosition}
          options={[
            { id: 'bottom-left', label: 'Left' },
            { id: 'bottom-center', label: 'Bottom' },
            { id: 'bottom-right', label: 'Right' },
            { id: 'top-right', label: 'Top' },
          ]}
        />
      </Field>
      <Field label="Format">
        <Segmented<NumberFormat>
          value={format}
          onChange={setFormat}
          options={[
            { id: 'n', label: '1' },
            { id: 'page-n', label: 'Page 1' },
            { id: 'n-of-total', label: '1 of N' },
            { id: 'roman', label: 'i, ii' },
          ]}
        />
      </Field>
    </SingleDocShell>
  );
}
