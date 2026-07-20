import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SingleDocShell } from '@/components/SingleDocShell';
import { IconButton } from '@/components/ui';
import { organize, type PageOp } from '@/core/engine/organize';
import { useSingleDoc } from '@/lib/useSingleDoc';
import { generateAllThumbs, type PageThumb } from '@/lib/thumbs';
import { palette } from '@/lib/brand';

interface Row {
  index: number; // source page index (stable)
  rotation: number;
}

export default function OrganizeScreen() {
  const doc = useSingleDoc();
  const [rows, setRows] = React.useState<Row[]>([]);
  const [thumbs, setThumbs] = React.useState<PageThumb[]>([]);

  // (Re)build rows + render thumbnails whenever a new document is loaded.
  React.useEffect(() => {
    setRows(Array.from({ length: doc.pageCount }, (_, i) => ({ index: i, rotation: 0 })));
    setThumbs([]);
    if (doc.file?.uri && doc.pageCount > 0) {
      let cancelled = false;
      generateAllThumbs(doc.file.uri).then((t) => {
        if (!cancelled) setThumbs(t);
      });
      return () => {
        cancelled = true;
      };
    }
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
      runIcon="download-outline"
      busyLabel="Rebuilding on your device…"
    >
      <View style={styles.list}>
        {rows.map((r, pos) => {
          const thumb = thumbs[r.index];
          return (
            <View key={`${r.index}`} style={styles.row}>
              {thumb ? (
                <Image
                  source={{ uri: thumb.uri }}
                  style={[
                    styles.thumb,
                    // Show the pending rotation on the preview itself.
                    r.rotation !== 0 && { transform: [{ rotate: `${r.rotation}deg` }] },
                  ]}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty]}>
                  <Text style={styles.thumbNum}>{r.index + 1}</Text>
                </View>
              )}
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>Page {r.index + 1}</Text>
                {r.rotation !== 0 && <Text style={styles.rowMeta}>rotated {r.rotation}°</Text>}
              </View>
              <IconButton icon="chevron-up" label="Move up" onPress={() => move(pos, -1)} disabled={doc.busy} />
              <IconButton icon="chevron-down" label="Move down" onPress={() => move(pos, 1)} disabled={doc.busy} />
              <IconButton icon="refresh" label="Rotate 90 degrees" onPress={() => rotate(pos)} disabled={doc.busy} />
              <IconButton icon="close" label="Remove page" tint={palette.danger} onPress={() => remove(pos)} disabled={doc.busy} />
            </View>
          );
        })}
      </View>
      <Text style={styles.hint}>
        Reorder with the arrows, rotate with the circular arrow, remove with the cross. The
        preview shows the page as it will export.
      </Text>
    </SingleDocShell>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.surface2,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  thumb: {
    width: 42,
    height: 56,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  thumbEmpty: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbNum: { color: palette.muted, fontSize: 13, fontWeight: '700' },
  rowBody: { flex: 1, gap: 2 },
  rowLabel: { color: palette.foreground, fontSize: 14, fontWeight: '600' },
  rowMeta: { color: palette.brand, fontSize: 12 },
  hint: { color: palette.muted, fontSize: 12, lineHeight: 18 },
});
