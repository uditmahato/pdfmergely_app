import * as React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { merge } from '@/core/engine/merge';
import { PdfError } from '@/core/types';
import { formatBytes, pickPdfs, readBytes, shareResult, type PickedPdf } from '@/lib/files';
import { takeIncomingAll } from '@/lib/incoming';
import { palette } from '@/lib/brand';
import { BrandButton, BusyNote, ErrorNote, IconButton, PrivacyBadge, SuccessCard } from '@/components/ui';

interface Item extends PickedPdf {
  id: string;
}

let nextId = 1;

export default function MergeScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = React.useState<Item[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<{ filename: string; size: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const resultRef = React.useRef<{ bytes: Uint8Array; filename: string } | null>(null);

  // "Share PDFs -> PDFMergely -> Merge": preload any shared files.
  React.useEffect(() => {
    const shared = takeIncomingAll();
    if (shared.length) {
      setItems(shared.map((p) => ({ ...p, id: String(nextId++) })));
    }
  }, []);

  async function addFiles() {
    const picked = await pickPdfs(true);
    if (picked.length) {
      setItems((prev) => [...prev, ...picked.map((p) => ({ ...p, id: String(nextId++) }))]);
    }
  }

  function move(id: string, dir: -1 | 1) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const arr = prev.slice();
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  function reset() {
    setItems([]);
    setDone(null);
    resultRef.current = null;
  }

  async function run() {
    if (items.length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const sources = [];
      for (const item of items) {
        sources.push({ bytes: await readBytes(item.uri) });
      }
      const out = await merge(sources);
      resultRef.current = { bytes: out, filename: 'merged.pdf' };
      setDone({ filename: 'merged.pdf', size: out.byteLength });
      await shareResult(out, 'merged.pdf');
    } catch (e) {
      setError(
        e instanceof PdfError && e.code === 'ENCRYPTED'
          ? 'One of the PDFs is password-protected. Unlock it first.'
          : e instanceof PdfError && e.code === 'INVALID_PDF'
            ? 'One of the files is not a valid PDF.'
            : 'Something went wrong while merging. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <View style={[styles.screen, styles.center, { paddingBottom: insets.bottom + 16 }]}>
        <SuccessCard
          filename={done.filename}
          sizeLabel={formatBytes(done.size)}
          onShareAgain={() => {
            const r = resultRef.current;
            if (r) void shareResult(r.bytes, r.filename);
          }}
          onReset={reset}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={[styles.content, { paddingBottom: 130 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <PrivacyBadge />
            <Pressable
              onPress={addFiles}
              style={({ pressed }) => [styles.addCard, pressed && styles.pressed]}
            >
              <View style={styles.addIcon}>
                <Ionicons name="add" size={26} color={palette.brand} />
              </View>
              <Text style={styles.addText}>{items.length ? 'Add more PDFs' : 'Choose PDFs'}</Text>
              <Text style={styles.addSub}>Read locally, never uploaded</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{index + 1}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.size > 0 && <Text style={styles.rowSize}>{formatBytes(item.size)}</Text>}
            </View>
            <IconButton icon="chevron-up" label="Move up" onPress={() => move(item.id, -1)} disabled={busy} />
            <IconButton icon="chevron-down" label="Move down" onPress={() => move(item.id, 1)} disabled={busy} />
            <IconButton icon="close" label="Remove" tint={palette.danger} onPress={() => remove(item.id)} disabled={busy} />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Pick two or more PDFs to combine. They are read locally and merged on your phone.
          </Text>
        }
      />

      {items.length > 0 && (
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
          {error && <ErrorNote text={error} />}
          {busy ? (
            <BusyNote text="Merging on your device…" />
          ) : (
            <>
              <BrandButton
                title={`Merge ${items.length > 1 ? items.length : ''} PDF${items.length === 1 ? '' : 's'}`}
                icon="git-merge"
                onPress={run}
                disabled={items.length < 2}
              />
              {items.length === 1 && (
                <Text style={styles.hint}>Add at least two PDFs to merge.</Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  center: { justifyContent: 'center', padding: 16 },
  content: { padding: 16, gap: 8 },
  header: { gap: 14, paddingBottom: 10 },
  addCard: {
    borderColor: palette.border,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surface,
  },
  addIcon: {
    height: 52,
    width: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
    marginBottom: 2,
  },
  addText: { color: palette.foreground, fontWeight: '800', fontSize: 16 },
  addSub: { color: palette.muted, fontSize: 12 },
  pressed: { opacity: 0.85 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badge: {
    height: 26,
    width: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
  },
  badgeText: { color: palette.brand, fontSize: 12, fontWeight: '800' },
  rowBody: { flex: 1, gap: 2 },
  rowName: { color: palette.foreground, fontSize: 14, fontWeight: '600' },
  rowSize: { color: palette.muted, fontSize: 12 },
  empty: { color: palette.muted, textAlign: 'center', paddingVertical: 28, lineHeight: 20 },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
    backgroundColor: palette.bg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  hint: { color: palette.muted, fontSize: 12, textAlign: 'center' },
});
