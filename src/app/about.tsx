// About: brand, version, the privacy promise in plain words, and outbound
// links. Also satisfies the Play Store requirement for a reachable privacy
// policy inside the app.

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/lib/brand';

const LINKS: { title: string; sub: string; icon: keyof typeof Ionicons.glyphMap; url: string }[] = [
  {
    title: 'Privacy policy',
    sub: 'pdfmergely.com/privacy',
    icon: 'shield-checkmark-outline',
    url: 'https://pdfmergely.com/privacy',
  },
  {
    title: 'All tools on the web',
    sub: 'pdfmergely.com',
    icon: 'globe-outline',
    url: 'https://pdfmergely.com',
  },
];

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.brandBlock}>
        <View style={styles.mark}>
          <Ionicons name="shield-checkmark" size={34} color={palette.brand} />
        </View>
        <Text style={styles.appName}>PDFMergely</Text>
        <Text style={styles.version}>Version {version}</Text>
      </View>

      <View style={styles.promiseBox}>
        <Text style={styles.promiseTitle}>Your files stay yours</Text>
        <Text style={styles.promiseText}>
          Every tool runs entirely on this phone. Your PDFs are never uploaded, there are no
          accounts, and the app collects no analytics. Airplane mode works fine.
        </Text>
      </View>

      {LINKS.map((l) => (
        <Pressable
          key={l.url}
          onPress={() => void Linking.openURL(l.url)}
          accessibilityRole="link"
          accessibilityLabel={l.title}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <View style={styles.linkIcon}>
            <Ionicons name={l.icon} size={20} color={palette.brand} />
          </View>
          <View style={styles.linkBody}>
            <Text style={styles.linkTitle}>{l.title}</Text>
            <Text style={styles.linkSub}>{l.sub}</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={palette.muted} />
        </Pressable>
      ))}

      <Text style={styles.footnote}>
        More tools — compress, OCR, repair and others — live on the web app and are coming to
        mobile.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 12 },
  brandBlock: { alignItems: 'center', gap: 4, paddingVertical: 18 },
  mark: {
    height: 68,
    width: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
    marginBottom: 6,
  },
  appName: { color: palette.foreground, fontSize: 20, fontWeight: '800' },
  version: { color: palette.muted, fontSize: 13 },
  promiseBox: {
    backgroundColor: palette.brandSoft,
    borderColor: palette.brand,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  promiseTitle: { color: palette.foreground, fontSize: 15, fontWeight: '800' },
  promiseText: { color: 'hsl(210, 30%, 85%)', fontSize: 13, lineHeight: 19 },
  linkRow: {
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
  linkIcon: {
    height: 38,
    width: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
  },
  linkBody: { flex: 1, gap: 1 },
  linkTitle: { color: palette.foreground, fontSize: 15, fontWeight: '700' },
  linkSub: { color: palette.muted, fontSize: 12 },
  footnote: { color: palette.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', paddingTop: 8 },
  pressed: { opacity: 0.85 },
});
