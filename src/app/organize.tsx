import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
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
            <Pressable onPress={() => move(pos, -1)} style={styles.iconBtn} disabled={doc.busy}>
              <Text style={styles.icon}>↑</Text>
            </Pressable>
            <Pressable onPress={() => move(pos, 1)} style={styles.iconBtn} disabled={doc.busy}>
              <Text style={styles.icon}>↓</Text>
            </Pressable>
            <Pressable onPress={() => rotate(pos)} style={styles.iconBtn} disabled={doc.busy}>
              <Text style={styles.icon}>⟳</Text>
            </Pressable>
            <Pressable onPress={() => remove(pos)} style={styles.iconBtn} disabled={doc.busy}>
              <Text style={[styles.icon, styles.danger]}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>
      <Text style={styles.hint}>
        Reorder with ↑↓, tap ⟳ to rotate a page by 90°, ✕ to remove it. Page previews arrive in a
        later update.
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
  iconBtn: {
    height: 38,
    width: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface2,
  },
  icon: { color: palette.foreground, fontSize: 15 },
  danger: { color: palette.danger },
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
