// Home: a native launcher, not a landing page. Compact sectioned 3-column
// grid of tool tiles with Android ripple; the privacy promise is a slim
// badge (the full pitch lives in About, reachable from the header).

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/lib/brand';
import { SECTIONS, TOOLS, type ToolDef } from '@/lib/tools';
import { PrivacyBadge } from '@/components/ui';

function Tile({ tool, tint }: { tool: ToolDef; tint: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/${tool.slug}` as never)}
      accessibilityRole="button"
      accessibilityLabel={`${tool.name}. ${tool.tagline}`}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.07)', foreground: true }}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <View style={[styles.tileIcon, { backgroundColor: `${tint}1f` }]}>
        <Ionicons name={tool.icon} size={26} color={tint} />
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
      {SECTIONS.map(({ title, tint }) => (
        <View key={title}>
          <View style={styles.sectionRow}>
            {/* The dot teaches the rule: this color = this category. */}
            <View style={[styles.sectionDot, { backgroundColor: tint }]} />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <View style={styles.grid}>
            {TOOLS.filter((t) => t.section === title).map((t) => (
              <Tile key={t.slug} tool={t} tint={tint} />
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
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionDot: { height: 7, width: 7, borderRadius: 4 },
  sectionTitle: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
