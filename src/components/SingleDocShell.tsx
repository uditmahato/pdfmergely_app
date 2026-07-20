// Screen scaffold for single-document tools: handles the pick/none state,
// shows the loaded file, renders tool-specific options, and the run CTA.

import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/lib/brand';
import { formatBytes } from '@/lib/files';
import type { SingleDocState } from '@/lib/useSingleDoc';
import { BrandButton, BusyNote, DoneNote, ErrorNote, PrivacyBadge } from '@/components/ui';

export function SingleDocShell({
  doc,
  runLabel,
  onRun,
  busyLabel = 'Processing on your device…',
  runDisabled,
  children,
}: {
  doc: SingleDocState;
  runLabel: string;
  onRun: () => void;
  busyLabel?: string;
  runDisabled?: boolean;
  children?: React.ReactNode; // tool-specific options
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PrivacyBadge />

      {!doc.file ? (
        <>
          <Pressable
            onPress={doc.pick}
            style={({ pressed }) => [styles.picker, pressed && styles.pressed]}
          >
            <Text style={styles.pickerText}>Choose a PDF</Text>
            <Text style={styles.pickerSub}>Read locally, never uploaded</Text>
          </Pressable>
          {doc.error && <ErrorNote text={doc.error} />}
          {doc.busy && <BusyNote text="Reading your PDF…" />}
        </>
      ) : (
        <>
          <View style={styles.fileRow}>
            <View style={styles.fileBody}>
              <Text style={styles.fileName} numberOfLines={1}>
                {doc.file.name}
              </Text>
              <Text style={styles.fileMeta}>
                {doc.pageCount} page{doc.pageCount === 1 ? '' : 's'}
                {doc.file.size ? ` · ${formatBytes(doc.file.size)}` : ''}
              </Text>
            </View>
            <Pressable onPress={doc.reset} disabled={doc.busy} style={styles.resetBtn}>
              <Text style={styles.resetText}>✕</Text>
            </Pressable>
          </View>

          {children}

          {doc.error && <ErrorNote text={doc.error} />}
          {doc.done && (
            <DoneNote
              text={`${doc.done.filename} (${formatBytes(doc.done.size)}) built on your device. Use the share sheet to save or send it.`}
            />
          )}

          {doc.busy ? (
            <BusyNote text={busyLabel} />
          ) : (
            <BrandButton title={runLabel} onPress={onRun} disabled={runDisabled} />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 14 },
  picker: {
    borderColor: palette.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 34,
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.surface,
  },
  pickerText: { color: palette.brand, fontWeight: '700', fontSize: 16 },
  pickerSub: { color: palette.muted, fontSize: 12 },
  pressed: { opacity: 0.85 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fileBody: { flex: 1, gap: 2 },
  fileName: { color: palette.foreground, fontSize: 14, fontWeight: '600' },
  fileMeta: { color: palette.muted, fontSize: 12 },
  resetBtn: {
    height: 36,
    width: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface2,
  },
  resetText: { color: palette.danger, fontSize: 15 },
});
