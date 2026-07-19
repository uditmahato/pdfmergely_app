import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { merge } from '@/core/engine/merge';
import { PdfError } from '@/core/types';
import { formatBytes, pickPdfs, readBytes, shareResult, type PickedPdf } from '@/lib/files';
import { palette } from '@/lib/brand';

interface Item extends PickedPdf {
  id: string;
}

let nextId = 1;

export default function MergeScreen() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<{ filename: string; size: number } | null>(null);

  async function addFiles() {
    const picked = await pickPdfs(true);
    if (picked.length) {
      setItems((prev) => [...prev, ...picked.map((p) => ({ ...p, id: String(nextId++) }))]);
      setDone(null);
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

  async function run() {
    if (items.length < 2) return;
    setBusy(true);
    try {
      // Read every picked file into memory, then run the SAME merge engine
      // the web app ships. Everything happens on this device.
      const sources = [];
      for (const item of items) {
        sources.push({ bytes: await readBytes(item.uri) });
      }
      const out = await merge(sources);
      const filename = 'merged.pdf';
      setDone({ filename, size: out.byteLength });
      await shareResult(out, filename);
    } catch (e) {
      const message =
        e instanceof PdfError && e.code === 'ENCRYPTED'
          ? 'One of the PDFs is password-protected. Unlock it first.'
          : e instanceof PdfError && e.code === 'INVALID_PDF'
            ? 'One of the files is not a valid PDF.'
            : 'Something went wrong while merging. Please try again.';
      Alert.alert('Could not merge', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.privacy}>
              Files never leave your device · No upload · Free
            </Text>
            <Pressable onPress={addFiles} style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}>
              <Text style={styles.addBtnText}>{items.length ? 'Add more PDFs' : 'Choose PDFs'}</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowName} numberOfLines={1}>
                {index + 1}. {item.name}
              </Text>
              {item.size > 0 && <Text style={styles.rowSize}>{formatBytes(item.size)}</Text>}
            </View>
            <Pressable onPress={() => move(item.id, -1)} style={styles.iconBtn} disabled={busy}>
              <Text style={styles.iconText}>↑</Text>
            </Pressable>
            <Pressable onPress={() => move(item.id, 1)} style={styles.iconBtn} disabled={busy}>
              <Text style={styles.iconText}>↓</Text>
            </Pressable>
            <Pressable onPress={() => remove(item.id)} style={styles.iconBtn} disabled={busy}>
              <Text style={[styles.iconText, styles.removeText]}>✕</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Pick two or more PDFs to combine. They are read locally and merged on your phone.
          </Text>
        }
        ListFooterComponent={
          done ? (
            <Text style={styles.doneNote}>
              Merged {done.filename} ({formatBytes(done.size)}) built on your device. Use the share
              sheet to save or send it.
            </Text>
          ) : null
        }
      />

      <View style={styles.footer}>
        {busy ? (
          <View style={styles.busyBox}>
            <ActivityIndicator color={palette.brand} />
            <Text style={styles.busyText}>Merging on your device…</Text>
          </View>
        ) : (
          <Pressable
            onPress={run}
            disabled={items.length < 2}
            style={({ pressed }) => [
              styles.cta,
              items.length < 2 && styles.ctaDisabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.ctaText}>
              Merge {items.length > 1 ? items.length : ''} PDF{items.length === 1 ? '' : 's'}
            </Text>
          </Pressable>
        )}
        {items.length === 1 && <Text style={styles.hint}>Add at least two PDFs to merge.</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 8 },
  header: { gap: 12, paddingBottom: 10 },
  privacy: { color: palette.brand, fontSize: 12, textAlign: 'center' },
  addBtn: {
    borderColor: palette.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 22,
    alignItems: 'center',
    backgroundColor: palette.surface,
  },
  addBtnText: { color: palette.brand, fontWeight: '700', fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowBody: { flex: 1, gap: 2 },
  rowName: { color: palette.foreground, fontSize: 14, fontWeight: '600' },
  rowSize: { color: palette.muted, fontSize: 12 },
  iconBtn: {
    height: 40,
    width: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface2,
  },
  iconText: { color: palette.foreground, fontSize: 16 },
  removeText: { color: palette.danger },
  empty: { color: palette.muted, textAlign: 'center', paddingVertical: 30, lineHeight: 20 },
  doneNote: { color: palette.brand, fontSize: 13, textAlign: 'center', paddingVertical: 14, lineHeight: 19 },
  footer: { padding: 16, gap: 8, borderTopWidth: 1, borderTopColor: palette.border },
  cta: {
    backgroundColor: palette.brandStrong,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  pressed: { opacity: 0.85 },
  busyBox: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  busyText: { color: palette.foreground, fontSize: 14 },
  hint: { color: palette.muted, fontSize: 12, textAlign: 'center' },
});
