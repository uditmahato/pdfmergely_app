// Document detail: preview, metadata, and actions for one library document.
// "Apply a tool" reuses the incoming-chooser flow, so every tool the app has
// works on library documents with zero extra wiring.

import * as React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { palette, type } from '@/lib/brand';
import { formatBytes } from '@/lib/files';
import { stashIncoming } from '@/lib/incoming';
import { deleteDoc, docUri, getDoc, renameDoc } from '@/lib/library';
import { performScan } from '@/lib/scanFlow';
import { generateCoverThumb } from '@/lib/thumbs';
import { TextField } from '@/components/ui';
import { setIncomingScreenFiles } from '../incoming';

export default function DocDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [version, setVersion] = React.useState(0); // bump after rename
  const doc = React.useMemo(() => (id ? getDoc(id) : undefined), [id, version]);
  const [cover, setCover] = React.useState<string | null>(null);
  const [renaming, setRenaming] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    if (doc) {
      generateCoverThumb(docUri(doc), 70).then((t) => {
        if (!cancelled && t) setCover(t.uri);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [doc]);

  if (!doc) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.missing}>This document is no longer in your library.</Text>
      </View>
    );
  }

  function applyTool() {
    if (!doc) return;
    const file = { name: doc.name, size: doc.size, uri: docUri(doc) };
    stashIncoming([file]);
    setIncomingScreenFiles([file]);
    router.push('/incoming' as never);
  }

  function share() {
    if (!doc) return;
    void Sharing.shareAsync(docUri(doc), { mimeType: 'application/pdf', dialogTitle: doc.name });
  }

  function confirmDelete() {
    if (!doc) return;
    Alert.alert('Delete document?', `“${doc.name}” will be removed from this phone. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteDoc(doc.id);
          router.back();
        },
      },
    ]);
  }

  // Batch scanning is the core habit: every document offers the next scan.
  async function scanAnother() {
    try {
      const entry = await performScan();
      if (entry) router.replace(`/doc/${entry.id}` as never);
    } catch {
      Alert.alert('Scanner unavailable', 'The on-device scanner needs Google Play services.');
    }
  }

  function startRename() {
    if (!doc) return;
    setNewName(doc.name.replace(/\.pdf$/i, ''));
    setRenaming(true);
  }

  function commitRename() {
    if (doc && newName.trim()) renameDoc(doc.id, newName);
    setRenaming(false);
    setVersion((v) => v + 1);
  }

  return (
    <View style={styles.screen}>
      {/* Rename lives ON the title, CamScanner-style: the name is the
          tappable thing, not a separate button further down. */}
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              onPress={startRename}
              accessibilityRole="button"
              accessibilityLabel={`Rename ${doc.name}`}
              hitSlop={8}
              style={styles.titleWrap}
            >
              <Text style={styles.titleText} numberOfLines={1}>
                {doc.name}
              </Text>
              <Ionicons name="pencil" size={15} color={palette.muted} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.coverWrap}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.cover} resizeMode="contain" />
          ) : (
            <View style={[styles.cover, styles.coverFallback]}>
              <Ionicons name="document-text" size={40} color={palette.danger} />
            </View>
          )}
        </View>

        <Text style={styles.meta}>
          {doc.pages > 0 ? `${doc.pages} page${doc.pages === 1 ? '' : 's'} · ` : ''}
          {formatBytes(doc.size)} · saved {new Date(doc.createdAt).toLocaleDateString()} · stored
          on this phone
        </Text>
      </ScrollView>

      {/* One toolbar, four actions — no button pile. */}
      <View style={styles.toolbar}>
        <ToolbarAction icon="camera" label="Scan" onPress={() => void scanAnother()} />
        <ToolbarAction icon="construct-outline" label="Tool" onPress={applyTool} />
        <ToolbarAction icon="share-outline" label="Share" onPress={share} />
        <ToolbarAction icon="trash-outline" label="Delete" tint={palette.danger} onPress={confirmDelete} />
      </View>

      <Modal visible={renaming} transparent animationType="fade" onRequestClose={() => setRenaming(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename document</Text>
            <TextField value={newName} onChangeText={setNewName} autoFocus maxLength={80} />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setRenaming(false)}
                style={({ pressed }) => [styles.smallBtn, pressed && styles.pressed]}
              >
                <Text style={styles.smallBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={commitRename}
                style={({ pressed }) => [styles.smallBtn, styles.confirmBtn, pressed && styles.pressed]}
              >
                <Text style={[styles.smallBtnText, { color: '#ffffff' }]}>Rename</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ToolbarAction({
  icon,
  label,
  onPress,
  tint = palette.foreground,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  tint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.08)', foreground: true }}
      style={({ pressed }) => [styles.toolbarAction, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={21} color={tint} />
      <Text style={[styles.toolbarLabel, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  missing: { color: palette.muted, fontSize: 14, fontFamily: type.regular, textAlign: 'center' },
  content: { padding: 16, gap: 12 },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 7, maxWidth: 280 },
  titleText: { color: palette.foreground, fontSize: 17, fontFamily: type.display, flexShrink: 1 },
  coverWrap: { alignItems: 'center', paddingVertical: 10 },
  cover: {
    height: 380,
    width: 285,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  meta: { color: palette.muted, fontSize: 12, fontFamily: type.regular, textAlign: 'center' },
  toolbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.bg,
    paddingVertical: 6,
    paddingBottom: 14,
  },
  toolbarAction: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  toolbarLabel: { fontSize: 11, fontFamily: type.semibold },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.surface2,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  dangerBtn: { borderColor: 'rgba(248, 113, 113, 0.35)' },
  confirmBtn: { backgroundColor: palette.brandStrong, borderColor: palette.brandStrong },
  smallBtnText: { color: palette.foreground, fontSize: 13, fontFamily: type.semibold },
  pressed: { opacity: 0.85 },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    alignSelf: 'stretch',
    backgroundColor: palette.surface2,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  modalTitle: { color: palette.foreground, fontSize: 16, fontFamily: type.display },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
});
