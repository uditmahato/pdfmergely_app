// Landing screen when PDFs are shared into the app: shows what arrived and
// which tools can take it. Files wait in the incoming stash; the chosen tool
// consumes them on mount.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/lib/brand';
import { formatBytes, type PickedPdf } from '@/lib/files';
import { PrivacyBadge } from '@/components/ui';

type IconName = keyof typeof Ionicons.glyphMap;

// Module-level so the params survive this screen remounting.
let currentFiles: PickedPdf[] = [];
export function setIncomingScreenFiles(files: PickedPdf[]) {
  currentFiles = files;
}

const SINGLE_TOOLS: { slug: string; name: string; icon: IconName }[] = [
  { slug: 'split', name: 'Split', icon: 'cut' },
  { slug: 'organize', name: 'Organize', icon: 'swap-vertical' },
  { slug: 'watermark', name: 'Watermark', icon: 'water' },
  { slug: 'page-numbers', name: 'Page numbers', icon: 'list' },
  { slug: 'protect', name: 'Protect', icon: 'lock-closed' },
  { slug: 'unlock', name: 'Unlock', icon: 'lock-open' },
  { slug: 'metadata', name: 'Metadata', icon: 'eye-off' },
  { slug: 'bates', name: 'Bates numbers', icon: 'pricetag' },
  { slug: 'resize', name: 'Resize', icon: 'resize' },
  { slug: 'nup', name: 'N-up', icon: 'grid' },
  { slug: 'flatten', name: 'Flatten', icon: 'layers' },
  { slug: 'signature', name: 'Remove signatures', icon: 'shield-half' },
];

export default function IncomingScreen() {
  const router = useRouter();
  const files = currentFiles;
  const many = files.length > 1;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PrivacyBadge />

      <View style={styles.fileBox}>
        <Ionicons name="download-outline" size={18} color={palette.brand} />
        <View style={styles.fileBody}>
          {files.length === 0 ? (
            <Text style={styles.fileName}>Nothing was shared</Text>
          ) : (
            files.map((f) => (
              <Text key={f.uri} style={styles.fileName} numberOfLines={1}>
                {f.name}
                {f.size ? `  ·  ${formatBytes(f.size)}` : ''}
              </Text>
            ))
          )}
        </View>
      </View>

      <Text style={styles.prompt}>
        {many ? `What do you want to do with these ${files.length} PDFs?` : 'What do you want to do with it?'}
      </Text>

      {many ? (
        <Pressable
          onPress={() => router.replace('/merge' as never)}
          style={({ pressed }) => [styles.tool, pressed && styles.pressed]}
        >
          <View style={styles.toolIcon}>
            <Ionicons name="git-merge" size={20} color={palette.brand} />
          </View>
          <Text style={styles.toolName}>Merge into one PDF</Text>
          <Ionicons name="chevron-forward" size={18} color={palette.muted} />
        </Pressable>
      ) : (
        SINGLE_TOOLS.map((t) => (
          <Pressable
            key={t.slug}
            onPress={() => router.replace(`/${t.slug}` as never)}
            style={({ pressed }) => [styles.tool, pressed && styles.pressed]}
          >
            <View style={styles.toolIcon}>
              <Ionicons name={t.icon} size={20} color={palette.brand} />
            </View>
            <Text style={styles.toolName}>{t.name}</Text>
            <Ionicons name="chevron-forward" size={18} color={palette.muted} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 10 },
  fileBox: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: palette.brandSoft,
    borderRadius: 14,
    padding: 14,
  },
  fileBody: { flex: 1, gap: 4 },
  fileName: { color: palette.foreground, fontSize: 14, fontWeight: '600' },
  prompt: { color: palette.muted, fontSize: 14, paddingTop: 6, paddingBottom: 2 },
  tool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface2,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  toolIcon: {
    height: 38,
    width: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
  },
  toolName: { flex: 1, color: palette.foreground, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});
