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
import { palette } from '@/lib/brand';
import { formatBytes } from '@/lib/files';
import { stashIncoming } from '@/lib/incoming';
import { deleteDoc, docUri, getDoc, renameDoc } from '@/lib/library';
import { generateCoverThumb } from '@/lib/thumbs';
import { BrandButton, TextField } from '@/components/ui';
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: doc.name }} />

      <View style={styles.coverWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="contain" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Ionicons name="document-text" size={40} color={palette.danger} />
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {doc.name}
      </Text>
      <Text style={styles.meta}>
        {doc.pages > 0 ? `${doc.pages} page${doc.pages === 1 ? '' : 's'} · ` : ''}
        {formatBytes(doc.size)} · saved {new Date(doc.createdAt).toLocaleDateString()} · stored
        on this phone
      </Text>

      <View style={styles.actions}>
        <BrandButton title="Apply a tool" icon="construct" onPress={applyTool} />
        <BrandButton title="Share / Save a copy" icon="share-outline" variant="secondary" onPress={share} />
        <View style={styles.rowActions}>
          <Pressable
            onPress={startRename}
            accessibilityRole="button"
            style={({ pressed }) => [styles.smallBtn, pressed && styles.pressed]}
          >
            <Ionicons name="pencil" size={16} color={palette.foreground} />
            <Text style={styles.smallBtnText}>Rename</Text>
          </Pressable>
          <Pressable
            onPress={confirmDelete}
            accessibilityRole="button"
            style={({ pressed }) => [styles.smallBtn, styles.dangerBtn, pressed && styles.pressed]}
          >
            <Ionicons name="trash" size={16} color={palette.danger} />
            <Text style={[styles.smallBtnText, { color: palette.danger }]}>Delete</Text>
          </Pressable>
        </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  missing: { color: palette.muted, fontSize: 14, textAlign: 'center' },
  content: { padding: 16, gap: 10 },
  coverWrap: { alignItems: 'center', paddingVertical: 8 },
  cover: {
    height: 300,
    width: 225,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  name: { color: palette.foreground, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  meta: { color: palette.muted, fontSize: 12, textAlign: 'center' },
  actions: { gap: 8, paddingTop: 10 },
  rowActions: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingTop: 4 },
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
  smallBtnText: { color: palette.foreground, fontSize: 13, fontWeight: '700' },
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
  modalTitle: { color: palette.foreground, fontSize: 16, fontWeight: '800' },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
});
