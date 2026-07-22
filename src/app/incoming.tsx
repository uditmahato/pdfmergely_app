// Landing screen when PDFs are shared into the app: shows what arrived and
// which tools can take it. Files wait in the incoming stash; the chosen tool
// consumes them on mount.

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette, type } from '@/lib/brand';
import { formatBytes, type PickedPdf } from '@/lib/files';
import { MERGE_TOOL, SINGLE_TOOLS, sectionTint, type ToolDef } from '@/lib/tools';
import { PrivacyBadge } from '@/components/ui';

// Module-level so the params survive this screen remounting.
let currentFiles: PickedPdf[] = [];
export function setIncomingScreenFiles(files: PickedPdf[]) {
  currentFiles = files;
}

export default function IncomingScreen() {
  const router = useRouter();
  const files = currentFiles;
  const many = files.length > 1;

  const ToolRow = ({ tool }: { tool: ToolDef }) => {
    const tint = sectionTint(tool.section);
    return (
      <Pressable
        onPress={() => router.replace(`/${tool.slug}` as never)}
        accessibilityRole="button"
        accessibilityLabel={tool.name}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.07)', foreground: true }}
        style={({ pressed }) => [styles.tool, pressed && styles.pressed]}
      >
        <View style={[styles.toolIcon, { backgroundColor: `${tint}1f` }]}>
          <Ionicons name={tool.icon} size={20} color={tint} />
        </View>
        <Text style={styles.toolName}>{tool.name}</Text>
        <Ionicons name="chevron-forward" size={18} color={palette.muted} />
      </Pressable>
    );
  };

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
        <ToolRow tool={MERGE_TOOL} />
      ) : (
        SINGLE_TOOLS.map((t) => <ToolRow key={t.slug} tool={t} />)
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
  fileName: { color: palette.foreground, fontSize: 14, fontFamily: type.semibold },
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
  },
  toolName: { flex: 1, color: palette.foreground, fontSize: 15, fontFamily: type.semibold },
  pressed: { opacity: 0.85 },
});
