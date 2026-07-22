// Docs: the local library and the app's home. Every document here lives in
// the app's private storage on this phone — imported, produced by a tool, or
// (soon) scanned. Nothing leaves unless the user shares it.

import * as React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/lib/brand';
import { formatBytes, pickPdfs, readBytes } from '@/lib/files';
import { docUri, listDocs, saveDoc, type DocEntry } from '@/lib/library';
import { probe } from '@/core/engine/merge';
import { performScan } from '@/lib/scanFlow';
import { generateCoverThumb } from '@/lib/thumbs';
import { PrivacyBadge } from '@/components/ui';

function Cover({ entry }: { entry: DocEntry }) {
  const [uri, setUri] = React.useState<string | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    generateCoverThumb(docUri(entry)).then((t) => {
      if (!cancelled && t) setUri(t.uri);
    });
    return () => {
      cancelled = true;
    };
  }, [entry]);
  if (!uri) {
    return (
      <View style={[styles.cover, styles.coverFallback]}>
        <Ionicons name="document-text" size={22} color={palette.danger} />
      </View>
    );
  }
  return <Image source={{ uri }} style={styles.cover} resizeMode="cover" />;
}

export default function DocsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [docs, setDocs] = React.useState<DocEntry[]>([]);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(() => setDocs(listDocs()), []);

  // Refresh whenever the tab regains focus (a tool may have saved a result).
  useFocusEffect(refresh);

  async function importPdfs() {
    setBusy(true);
    try {
      const picked = await pickPdfs(true);
      for (const p of picked) {
        const bytes = await readBytes(p.uri);
        let pages = 0;
        try {
          pages = (await probe(bytes.slice())).pageCount;
        } catch {
          // Unreadable PDFs can still be stored; tools will report errors.
        }
        saveDoc(bytes, p.name, { pages, source: 'import' });
      }
      refresh();
    } finally {
      setBusy(false);
    }
  }

  // The CamScanner moment, minus CamScanner: ML Kit's scanner runs entirely
  // on-device in a Play-services activity (edge detection, crop, filters,
  // multi-page), we build the PDF in JS, and it lands in the local library.
  // fromScan=1 keeps the post-scan screen in scanning mode (Scan another).
  async function scan() {
    setBusy(true);
    try {
      const entry = await performScan();
      if (!entry) return; // cancelled
      refresh();
      router.push(`/doc/${entry.id}?fromScan=1` as never);
    } catch {
      Alert.alert(
        'Scanner unavailable',
        'The on-device scanner needs Google Play services. You can still import PDFs or photos.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={docs}
        keyExtractor={(d) => d.id}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 104 }]}
        ListHeaderComponent={<PrivacyBadge />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/doc/${item.id}` as never)}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.07)', foreground: true }}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Cover entry={item} />
            <View style={styles.rowBody}>
              <Text style={styles.rowName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.rowMeta}>
                {item.pages > 0 ? `${item.pages} page${item.pages === 1 ? '' : 's'} · ` : ''}
                {formatBytes(item.size)}
                {item.source === 'tool' ? ' · from a tool' : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={palette.muted} />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="documents-outline" size={34} color={palette.brand} />
            </View>
            <Text style={styles.emptyTitle}>No documents yet</Text>
            <Text style={styles.emptyText}>
              Import a PDF or run a tool — everything you make is saved here, in this app, on
              this phone. No cloud, ever.
            </Text>
          </View>
        }
      />

      <View style={[styles.fabColumn, { bottom: insets.bottom + 20 }]}>
        <Pressable
          onPress={() => void importPdfs()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Import PDFs into your library"
          android_ripple={{ color: 'rgba(255, 255, 255, 0.1)', foreground: true }}
          style={({ pressed }) => [styles.miniFab, pressed && styles.fabPressed, busy && styles.fabBusy]}
        >
          <Ionicons name="document-attach-outline" size={16} color={palette.foreground} />
          <Text style={styles.miniFabLabel}>Import</Text>
        </Pressable>
        <Pressable
          onPress={() => void scan()}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Scan a document with the camera"
          android_ripple={{ color: 'rgba(255, 255, 255, 0.15)', foreground: true }}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed, busy && styles.fabBusy]}
        >
          <Ionicons name="camera" size={22} color="#ffffff" />
          <Text style={styles.fabLabel}>{busy ? 'Working…' : 'Scan'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface2,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9 },
  cover: {
    height: 56,
    width: 44,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  rowBody: { flex: 1, gap: 3 },
  rowName: { color: palette.foreground, fontSize: 15, fontWeight: '700' },
  rowMeta: { color: palette.muted, fontSize: 12 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 60, paddingHorizontal: 24 },
  emptyIcon: {
    height: 72,
    width: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
    marginBottom: 6,
  },
  emptyTitle: { color: palette.foreground, fontSize: 17, fontWeight: '800' },
  emptyText: { color: palette.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  fabColumn: { position: 'absolute', right: 20, alignItems: 'flex-end', gap: 10 },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.brandStrong,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 15,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  miniFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surface2,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: 'hidden',
  },
  miniFabLabel: { color: palette.foreground, fontSize: 13, fontWeight: '700' },
  fabPressed: { transform: [{ scale: 0.97 }] },
  fabBusy: { opacity: 0.7 },
  fabLabel: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
