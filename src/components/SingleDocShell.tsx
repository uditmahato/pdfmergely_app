// Screen scaffold for single-document tools: dropzone-style picker, loaded-file
// card, tool options, sticky bottom CTA, and a success card after the run.

import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/lib/brand';
import { formatBytes } from '@/lib/files';
import type { SingleDocState } from '@/lib/useSingleDoc';
import { BrandButton, BusyNote, ErrorNote, PrivacyBadge, SuccessCard } from '@/components/ui';

export function SingleDocShell({
  doc,
  runLabel,
  onRun,
  busyLabel = 'Processing on your device…',
  runDisabled,
  runIcon = 'sparkles',
  children,
}: {
  doc: SingleDocState;
  runLabel: string;
  onRun: () => void;
  busyLabel?: string;
  runDisabled?: boolean;
  runIcon?: React.ComponentProps<typeof Ionicons>['name'];
  children?: React.ReactNode; // tool-specific options
}) {
  const insets = useSafeAreaInsets();

  // Success state replaces the whole screen body, like the web DownloadCard.
  if (doc.done) {
    return (
      <View style={[styles.screen, styles.center, { paddingBottom: insets.bottom + 16 }]}>
        <SuccessCard
          filename={doc.done.filename}
          sizeLabel={formatBytes(doc.done.size)}
          onShareAgain={() => void doc.shareAgain()}
          onReset={doc.reset}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        keyboardShouldPersistTaps="handled"
      >
        <PrivacyBadge />

        {!doc.file ? (
          <>
            <Pressable
              onPress={doc.pick}
              style={({ pressed }) => [styles.picker, pressed && styles.pressed]}
            >
              <View style={styles.pickerIcon}>
                <Ionicons name="document-attach-outline" size={30} color={palette.brand} />
              </View>
              <Text style={styles.pickerText}>Choose a PDF</Text>
              <Text style={styles.pickerSub}>Read locally, never uploaded</Text>
            </Pressable>
            {doc.error && <ErrorNote text={doc.error} />}
            {doc.busy && <BusyNote text="Reading your PDF…" />}
          </>
        ) : (
          <>
            <View style={styles.fileRow}>
              <View style={styles.fileIcon}>
                <Ionicons name="document-text" size={20} color={palette.danger} />
              </View>
              <View style={styles.fileBody}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {doc.file.name}
                </Text>
                <Text style={styles.fileMeta}>
                  {doc.pageCount} page{doc.pageCount === 1 ? '' : 's'}
                  {doc.file.size ? ` · ${formatBytes(doc.file.size)}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={doc.reset}
                disabled={doc.busy}
                hitSlop={6}
                style={styles.resetBtn}
                accessibilityLabel="Remove file"
              >
                <Ionicons name="close" size={18} color={palette.muted} />
              </Pressable>
            </View>

            {children}

            {doc.error && <ErrorNote text={doc.error} />}
          </>
        )}
      </ScrollView>

      {/* Sticky bottom CTA, thumb-reachable, above the home indicator. */}
      {doc.file && (
        <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
          {doc.busy ? (
            <BusyNote text={busyLabel} />
          ) : (
            <BrandButton title={runLabel} icon={runIcon} onPress={onRun} disabled={runDisabled} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  center: { justifyContent: 'center', padding: 16 },
  content: { padding: 16, gap: 14 },
  picker: {
    borderColor: palette.border,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.surface,
  },
  pickerIcon: {
    height: 64,
    width: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
    marginBottom: 4,
  },
  pickerText: { color: palette.foreground, fontWeight: '800', fontSize: 17 },
  pickerSub: { color: palette.muted, fontSize: 12 },
  pressed: { opacity: 0.85 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fileIcon: {
    height: 40,
    width: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
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
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: palette.bg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
});
