// Bottom tabs: the document-app structure. Docs (the local library) is the
// default tab — the app's home is YOUR documents, with tools one tab away.

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { palette } from '@/lib/brand';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.bg },
        headerShadowVisible: false,
        headerTintColor: palette.foreground,
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: 62,
          paddingTop: 6,
        },
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', paddingBottom: 6 },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'PDFMergely',
          tabBarLabel: 'Docs',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="documents" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
