// Root layout. The polyfill import MUST come first: @cantoo/pdf-lib's AES
// encryption calls crypto.getRandomValues, which Hermes does not provide.
import 'react-native-get-random-values';

import * as React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useShareIntent } from 'expo-share-intent';
import * as Linking from 'expo-linking';
import { palette } from '@/lib/brand';
import { stashIncoming } from '@/lib/incoming';
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

  // "Open with PDFMergely" (ACTION_VIEW): tapping a PDF in a file manager
  // delivers its content:// URI as the app URL. Route it through the same
  // incoming chooser; the tool screens read the bytes via expo-file-system,
  // which supports content:// URIs on Android. Our own pdfmergely:// scheme
  // URLs are ordinary navigation and must be ignored here.
  const url = Linking.useURL();
  const handledUrl = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!url || handledUrl.current === url) return;
    if (!url.startsWith('content://') && !url.startsWith('file://')) return;
    handledUrl.current = url;
    const name = decodeURIComponent(url.split('/').pop() ?? 'document.pdf');
    const file = { name: name.endsWith('.pdf') ? name : `${name}.pdf`, size: 0, uri: url };
    stashIncoming([file]);
    setIncomingScreenFiles([file]);
    router.push('/incoming' as never);
  }, [url, router]);

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
        <Stack.Screen name="index" options={{ title: 'PDFMergely' }} />
        <Stack.Screen name="incoming" options={{ title: 'Shared with PDFMergely' }} />
        <Stack.Screen name="merge" options={{ title: 'Merge PDF' }} />
        <Stack.Screen name="split" options={{ title: 'Split PDF' }} />
        <Stack.Screen name="organize" options={{ title: 'Organize PDF' }} />
        <Stack.Screen name="watermark" options={{ title: 'Watermark PDF' }} />
        <Stack.Screen name="page-numbers" options={{ title: 'Page Numbers' }} />
        <Stack.Screen name="protect" options={{ title: 'Protect PDF' }} />
        <Stack.Screen name="unlock" options={{ title: 'Unlock PDF' }} />
        <Stack.Screen name="metadata" options={{ title: 'Remove Metadata' }} />
        <Stack.Screen name="bates" options={{ title: 'Bates Numbering' }} />
        <Stack.Screen name="resize" options={{ title: 'Resize PDF' }} />
        <Stack.Screen name="nup" options={{ title: 'N-up PDF' }} />
        <Stack.Screen name="flatten" options={{ title: 'Flatten PDF' }} />
        <Stack.Screen name="signature" options={{ title: 'Remove Signatures' }} />
      </Stack>
    </>
  );
}
