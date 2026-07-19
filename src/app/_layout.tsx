// Root layout. The polyfill import MUST come first: @cantoo/pdf-lib's AES
// encryption calls crypto.getRandomValues, which Hermes does not provide.
import 'react-native-get-random-values';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { palette } from '@/lib/brand';

export default function RootLayout() {
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
        <Stack.Screen name="merge" options={{ title: 'Merge PDF' }} />
      </Stack>
    </>
  );
}
