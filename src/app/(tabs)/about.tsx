// About: brand, version, the privacy promise in plain words, and outbound
// links. Every URL here is live on pdfmergely.com (checked before adding) —
// no invented destinations. Also satisfies the Play Store requirement for a
// reachable privacy policy inside the app.

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { palette, type } from '@/lib/brand';
import { TOOLS } from '@/lib/tools';

type IconName = keyof typeof Ionicons.glyphMap;

interface LinkItem {
  title: string;
  sub: string;
  icon: IconName;
  url: string;
}

const LINK_GROUPS: { heading: string; links: LinkItem[] }[] = [
  {
    heading: 'Learn more',
    links: [
      {
        title: 'Blog',
        sub: 'Guides and updates from the team',
        icon: 'newspaper-outline',
        url: 'https://pdfmergely.com/blog',
      },
      {
        title: 'All tools on the web',
        sub: 'Compress, OCR, repair and 20+ more',
        icon: 'globe-outline',
        url: 'https://pdfmergely.com',
      },
      {
        title: 'Why privacy-friendly tools matter',
        sub: 'The thinking behind PDFMergely',
        icon: 'bulb-outline',
        url: 'https://pdfmergely.com/privacy-friendly-pdf-tools',
      },
    ],
  },
  {
    heading: 'Support',
    links: [
      {
        title: 'Contact us',
        sub: 'Questions, bugs, feature requests',
        icon: 'chatbubble-ellipses-outline',
        url: 'https://pdfmergely.com/contact',
      },
    ],
  },
  {
    heading: 'Legal',
    links: [
      {
        title: 'Privacy policy',
        sub: 'pdfmergely.com/privacy',
        icon: 'shield-checkmark-outline',
        url: 'https://pdfmergely.com/privacy',
      },
      {
        title: 'Terms of service',
        sub: 'pdfmergely.com/terms',
        icon: 'document-text-outline',
        url: 'https://pdfmergely.com/terms',
      },
    ],
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
        <Text style={styles.version}>
          Version {version} · {TOOLS.length} tools · Android
        </Text>
      </View>

      <View style={styles.promiseBox}>
        <Text style={styles.promiseTitle}>Your files stay yours</Text>
        <Text style={styles.promiseText}>
          Every tool runs entirely on this phone. Your PDFs are never uploaded, there are no
          accounts, and the app collects no analytics. Airplane mode works fine.
        </Text>
      </View>

      {LINK_GROUPS.map((group) => (
        <View key={group.heading} style={styles.group}>
          <Text style={styles.groupHeading}>{group.heading}</Text>
          {group.links.map((l) => (
            <Pressable
              key={l.url}
              onPress={() => void Linking.openURL(l.url)}
              accessibilityRole="link"
              accessibilityLabel={l.title}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.07)', foreground: true }}
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
        </View>
      ))}

      <Text style={styles.footnote}>
        The mobile app shares its PDF engine with pdfmergely.com — the same code, the same
        privacy promise, on every platform.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 12 },
  brandBlock: { alignItems: 'center', gap: 4, paddingVertical: 16 },
  mark: {
    height: 68,
    width: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
    marginBottom: 6,
  },
  appName: { color: palette.foreground, fontSize: 21, fontFamily: type.display },
  version: { color: palette.muted, fontSize: 13 },
  promiseBox: {
    backgroundColor: palette.brandSoft,
    borderColor: palette.brand,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  promiseTitle: { color: palette.foreground, fontSize: 15, fontFamily: type.display },
  promiseText: { color: 'hsl(210, 30%, 85%)', fontSize: 13, lineHeight: 19 },
  group: { gap: 8 },
  groupHeading: {
    color: palette.muted,
    fontSize: 13,
    fontFamily: type.semibold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    paddingTop: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.surface2,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
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
  linkTitle: { color: palette.foreground, fontSize: 15, fontFamily: type.semibold },
  linkSub: { color: palette.muted, fontSize: 12 },
  footnote: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  pressed: { opacity: 0.9 },
});
