import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@/lib/brand';
import { TOOLS, type ToolDef } from '@/lib/tools';

// Pure-JS (pdf-lib) tools, all sharing the web app's vendored engine. The
// canvas/WASM tools (OCR, scan, compress-to-size, previews) need native
// modules and arrive in later phases. About sits last so the grid stays even.
const CARDS: ToolDef[] = [
  ...TOOLS,
  { slug: 'about', name: 'About', tagline: 'Privacy, version & links', icon: 'information-circle', tint: '#94a3b8' },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      data={CARDS}
      numColumns={2}
      columnWrapperStyle={styles.column}
      keyExtractor={(t) => t.slug}
      ListHeaderComponent={
        <View style={styles.hero}>
          <View style={styles.privacyChip}>
            <Ionicons name="shield-checkmark" size={14} color={palette.brand} />
            <Text style={styles.privacyText}>Files never leave your phone</Text>
          </View>
          <Text style={styles.h1}>
            Private PDF tools,{'\n'}right on your <Text style={styles.h1Brand}>device</Text>
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        // Plain Pressable + router.push instead of <Link asChild>: asChild's
        // prop-cloning drops Pressable's function-form style, which silently
        // stripped the card background/border on device.
        <Pressable
          onPress={() => router.push(`/${item.slug}` as never)}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}. ${item.tagline}`}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={[styles.iconTile, { backgroundColor: `${item.tint}1f` }]}>
            <Ionicons name={item.icon} size={24} color={item.tint} />
          </View>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardTagline} numberOfLines={2}>
            {item.tagline}
          </Text>
        </Pressable>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          <Ionicons name="cloud-offline-outline" size={14} color={palette.muted} />
          <Text style={styles.footerText}>Works offline · No sign-up · Free</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: palette.bg },
  content: { padding: 16 },
  column: { gap: 12 },
  hero: { paddingTop: 8, paddingBottom: 20, gap: 12 },
  privacyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: palette.brandSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  privacyText: { color: palette.brand, fontSize: 12, fontWeight: '700' },
  h1: { color: palette.foreground, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  h1Brand: { color: palette.brand },
  card: {
    flex: 1,
    // surface2 + a visible border: plain `surface` is only ~3% lighter than
    // the page background and disappears entirely on real phone panels.
    backgroundColor: palette.surface2,
    borderColor: 'hsl(222, 26%, 24%)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    marginBottom: 12,
    minHeight: 128,
  },
  cardPressed: { backgroundColor: palette.surface2, transform: [{ scale: 0.98 }] },
  iconTile: {
    height: 44,
    width: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: palette.foreground, fontSize: 16, fontWeight: '700' },
  cardTagline: { color: palette.muted, fontSize: 12, lineHeight: 16 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 20,
  },
  footerText: { color: palette.muted, fontSize: 12 },
});
