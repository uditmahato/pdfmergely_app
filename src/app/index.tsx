import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/lib/brand';

interface ToolEntry {
  slug: string;
  name: string;
  tagline: string;
  available: boolean;
}

// Pure-JS (pdf-lib) tools, all sharing the web app's vendored engine. The
// canvas/WASM tools (OCR, scan, compress-to-size, previews) need native
// modules and arrive in later phases.
const TOOLS: ToolEntry[] = [
  { slug: 'merge', name: 'Merge PDF', tagline: 'Combine PDFs in the order you want', available: true },
  { slug: 'split', name: 'Split PDF', tagline: 'Extract page ranges into new files', available: true },
  { slug: 'organize', name: 'Organize PDF', tagline: 'Reorder, rotate and delete pages', available: true },
  { slug: 'watermark', name: 'Watermark PDF', tagline: 'Stamp text on every page', available: true },
  { slug: 'page-numbers', name: 'Page Numbers', tagline: 'Number your pages', available: true },
  { slug: 'protect', name: 'Protect PDF', tagline: 'Password-protect a PDF', available: true },
  { slug: 'unlock', name: 'Unlock PDF', tagline: 'Remove a known password', available: true },
  { slug: 'metadata', name: 'Remove Metadata', tagline: 'Strip author, dates and hidden data', available: true },
];

export default function Home() {
  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={TOOLS}
      keyExtractor={(t) => t.slug}
      ListHeaderComponent={
        <View style={styles.hero}>
          <Text style={styles.h1}>
            PDF tools that respect your <Text style={styles.h1Brand}>privacy</Text>
          </Text>
          <Text style={styles.sub}>
            Files are processed on this device and never uploaded. There is no server involved at
            all.
          </Text>
        </View>
      }
      renderItem={({ item }) =>
        item.available ? (
          <Link href={`/${item.slug}` as never} asChild>
            <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardTagline}>{item.tagline}</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </Pressable>
          </Link>
        ) : (
          <View style={[styles.card, styles.cardDisabled]}>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, styles.titleDisabled]}>{item.name}</Text>
              <Text style={styles.cardTagline}>{item.tagline}</Text>
            </View>
            <Text style={styles.soon}>Soon</Text>
          </View>
        )
      }
      ListFooterComponent={
        <Text style={styles.footer}>Same engine as pdfmergely.com · Works offline · Free</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: palette.bg },
  content: { padding: 16, gap: 10 },
  hero: { paddingVertical: 18, gap: 8 },
  h1: { color: palette.foreground, fontSize: 26, fontWeight: '800', lineHeight: 32 },
  h1Brand: { color: palette.brand },
  sub: { color: palette.muted, fontSize: 14, lineHeight: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardPressed: { backgroundColor: palette.surface2 },
  cardDisabled: { opacity: 0.55 },
  cardBody: { flex: 1, gap: 2 },
  cardTitle: { color: palette.foreground, fontSize: 16, fontWeight: '700' },
  titleDisabled: { color: palette.muted },
  cardTagline: { color: palette.muted, fontSize: 13 },
  chev: { color: palette.brand, fontSize: 24, fontWeight: '600' },
  soon: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: '700',
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  footer: { color: palette.muted, fontSize: 12, textAlign: 'center', paddingVertical: 18 },
});
