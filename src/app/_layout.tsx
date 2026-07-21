// Root layout. The polyfill import MUST come first: @cantoo/pdf-lib's AES
// encryption calls crypto.getRandomValues, which Hermes does not provide.
import 'react-native-get-random-values';

import * as React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useShareIntent } from 'expo-share-intent';
import { palette } from '@/lib/brand';
import { stashIncoming } from '@/lib/incoming';
import { TOOLS } from '@/lib/tools';
import { setIncomingScreenFiles } from './incoming';

// Android 12+ clips the OS splash to a circle, so it can only ever show the
// logo. The wordmark lives in this branded frame that continues the splash:
// OS splash (logo) -> this view (logo + name) -> home.
SplashScreen.preventAutoHideAsync().catch(() => {});

function BrandedSplash({ onDone }: { onDone: () => void }) {
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(onDone);
    }, 900);
    return () => clearTimeout(t);
  }, [opacity, onDone]);

  return (
    <Animated.View pointerEvents="none" style={[styles.splash, { opacity }]}>
      <View style={styles.splashMark}>
        <Ionicons name="shield-checkmark" size={46} color={palette.brand} />
      </View>
      <Text style={styles.splashName}>PDFMergely</Text>
      <Text style={styles.splashTagline}>Private PDF tools</Text>
    </Animated.View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  // "Share PDF -> PDFMergely": the share-intent module copies the files into
  // app-private storage; we stash them and route to the tool chooser. PDFs
  // only (the intent filters ask Android for application/pdf, but be safe).
  React.useEffect(() => {
    if (!hasShareIntent || !shareIntent.files?.length) return;
    const pdfs = shareIntent.files
      .filter((f) => f.mimeType === 'application/pdf' || f.fileName.toLowerCase().endsWith('.pdf'))
      .map((f) => ({
        name: f.fileName,
        size: f.size ?? 0,
        uri: f.path.startsWith('file://') ? f.path : `file://${f.path}`,
      }));
    resetShareIntent();
    if (!pdfs.length) return;
    stashIncoming(pdfs);
    setIncomingScreenFiles(pdfs);
    router.push('/incoming' as never);
  }, [hasShareIntent, shareIntent, resetShareIntent, router]);

  // "Open with PDFMergely" (ACTION_VIEW) is handled in +native-intent.ts:
  // expo-router consumes the intent URL before this component ever renders,
  // so it must be intercepted there, not with Linking.useURL() here.

  const [splashDone, setSplashDone] = React.useState(false);
  const finishSplash = React.useCallback(() => setSplashDone(true), []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          // Flat Material 3 style top bar: same color as the page, no
          // elevation seam, so the status-bar area blends seamlessly on
          // edge-to-edge Android instead of showing a two-tone band.
          headerStyle: { backgroundColor: palette.bg },
          headerShadowVisible: false,
          headerTintColor: palette.foreground,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: palette.bg },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'PDFMergely',
            // About lives in the app bar, where apps keep it — not as a
            // grid tile among the tools.
            headerRight: () => (
              <Pressable
                onPress={() => router.push('/about' as never)}
                accessibilityRole="button"
                accessibilityLabel="About PDFMergely"
                hitSlop={8}
              >
                {({ pressed }) => (
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color={pressed ? palette.muted : palette.foreground}
                  />
                )}
              </Pressable>
            ),
          }}
        />
        {/* Neutral title: this screen serves share-sheet arrivals, "Open
            with", and the in-app Open PDF button alike. */}
        <Stack.Screen name="incoming" options={{ title: 'Choose a tool' }} />
        {/* Headers come from the tool registry so they always match the
            home-card and chooser names exactly. */}
        {TOOLS.map((t) => (
          <Stack.Screen key={t.slug} name={t.slug} options={{ title: t.name }} />
        ))}
        <Stack.Screen name="about" options={{ title: 'About' }} />
      </Stack>
      {!splashDone && <BrandedSplash onDone={finishSplash} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg },
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  splashMark: {
    height: 92,
    width: 92,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
    marginBottom: 10,
  },
  splashName: { color: palette.foreground, fontSize: 26, fontWeight: '800', letterSpacing: 0.3 },
  splashTagline: { color: palette.muted, fontSize: 14 },
});
