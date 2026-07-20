// Root layout. The polyfill import MUST come first: @cantoo/pdf-lib's AES
// encryption calls crypto.getRandomValues, which Hermes does not provide.
import 'react-native-get-random-values';

import * as React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useShareIntent } from 'expo-share-intent';
import { palette } from '@/lib/brand';
import { stashIncoming } from '@/lib/incoming';
import { TOOLS } from '@/lib/tools';
import { setIncomingScreenFiles } from './incoming';

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

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.surface },
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
        <Stack.Screen name="incoming" options={{ title: 'Shared with PDFMergely' }} />
        {/* Headers come from the tool registry so they always match the
            home-card and chooser names exactly. */}
        {TOOLS.map((t) => (
          <Stack.Screen key={t.slug} name={t.slug} options={{ title: t.name }} />
        ))}
        <Stack.Screen name="about" options={{ title: 'About' }} />
      </Stack>
    </>
  );
}
