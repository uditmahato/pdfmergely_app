// Home: a native launcher, not a landing page. Compact sectioned 3-column
// grid of tool tiles with Android ripple; the privacy promise is a slim
// badge (the full pitch lives in About, reachable from the header).

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/lib/brand';
import { SECTION_ORDER, TOOLS, type ToolDef } from '@/lib/tools';
import { PrivacyBadge } from '@/components/ui';

function Tile({ tool }: { tool: ToolDef }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/${tool.slug}` as never)}
      accessibilityRole="button"
      accessibilityLabel={`${tool.name}. ${tool.tagline}`}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.07)', foreground: true }}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <View style={[styles.tileIcon, { backgroundColor: `${tool.tint}1f` }]}>
        <Ionicons name={tool.icon} size={26} color={tool.tint} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={2}>
        {tool.label}
      </Text>
    </Pressable>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
    >
      <PrivacyBadge />
      {SECTION_ORDER.map((section) => (
        <View key={section}>
          <Text style={styles.sectionTitle}>{section}</Text>
          <View style={styles.grid}>
            {TOOLS.filter((t) => t.section === section).map((t) => (
              <Tile key={t.slug} tool={t} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const TILE_GAP = 10;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 4 },
  sectionTitle: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingTop: 18,
    paddingBottom: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: TILE_GAP },
  tile: {
    // Three per row: 3 × 31% + 2 gaps < 100%, and a lone tile on the last
    // row keeps tile width instead of stretching (flexGrow 0).
    flexBasis: '31%',
    flexGrow: 0,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tilePressed: { transform: [{ scale: 0.96 }] },
  tileIcon: {
    height: 56,
    width: 56,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    color: palette.foreground,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },
});
