import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
import { IconButton } from '@/components/ui';
import { organize, type PageOp } from '@/core/engine/organize';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { palette } from '@/lib/brand';

interface Row {
  index: number; // source page index (stable)
  rotation: number;
}

export default function OrganizeScreen() {
  const doc = useSingleDoc();
  const [rows, setRows] = React.useState<Row[]>([]);

  // (Re)build rows whenever a new document is loaded.
  React.useEffect(() => {
    setRows(Array.from({ length: doc.pageCount }, (_, i) => ({ index: i, rotation: 0 })));
  }, [doc.pageCount, doc.file?.uri]);

  function move(pos: number, dir: -1 | 1) {
    setRows((prev) => {
      const j = pos + dir;
      if (j < 0 || j >= prev.length) return prev;
      const arr = prev.slice();
      [arr[pos], arr[j]] = [arr[j], arr[pos]];
      return arr;
    });
  }
  function rotate(pos: number) {
    setRows((prev) => prev.map((r, i) => (i === pos ? { ...r, rotation: (r.rotation + 90) % 360 } : r)));
  }
  function remove(pos: number) {
    setRows((prev) => prev.filter((_, i) => i !== pos));
  }

  async function run() {
    await doc.run(async (bytes) => {
      const ops: PageOp[] = rows.map((r) => ({ index: r.index, rotation: r.rotation }));
      return { bytes: await organize(bytes, ops), filename: 'organized.pdf' };
    });
  }

  return (
    <SingleDocShell
      doc={doc}
      runLabel={`Export ${rows.length} page${rows.length === 1 ? '' : 's'}`}
      onRun={run}
      runDisabled={rows.length === 0}
      busyLabel="Rebuilding on your device…"
    >
      <View style={styles.list}>
        {rows.map((r, pos) => (
          <View key={`${r.index}`} style={styles.row}>
            <Text style={styles.rowLabel}>
              Page {r.index + 1}
              {r.rotation ? `  ·  ${r.rotation}°` : ''}
            </Text>
            <IconButton icon="chevron-up" label="Move up" onPress={() => move(pos, -1)} disabled={doc.busy} />
            <IconButton icon="chevron-down" label="Move down" onPress={() => move(pos, 1)} disabled={doc.busy} />
            <IconButton icon="refresh" label="Rotate 90 degrees" onPress={() => rotate(pos)} disabled={doc.busy} />
            <IconButton icon="close" label="Remove page" tint={palette.danger} onPress={() => remove(pos)} disabled={doc.busy} />
          </View>
        ))}
      </View>
      <Text style={styles.hint}>
        Reorder with the arrows, rotate a page by 90° with the circular arrow, or remove it with
        the cross. Page previews arrive in a later update.
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rowLabel: { flex: 1, color: palette.foreground, fontSize: 14, fontWeight: '600' },
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
