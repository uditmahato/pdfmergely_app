// Bottom tabs: the document-app structure. Docs (the local library) is the
// default tab — the app's home is YOUR documents, with tools one tab away.

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { palette, type } from '@/lib/brand';

/** Brand wordmark for the Docs header: mark + Space Grotesk name. */
function Wordmark() {
  return (
    <View style={styles.wordmark}>
      <View style={styles.mark}>
        <Ionicons name="shield-checkmark" size={15} color={palette.brand} />
      </View>
      <Text style={styles.wordmarkText}>
        PDF<Text style={styles.wordmarkAccent}>Mergely</Text>
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.bg },
        headerShadowVisible: false,
        headerTintColor: palette.foreground,
        headerTitleStyle: { fontFamily: type.display, fontSize: 19 },
        tabBarStyle: {
          backgroundColor: palette.bg,
          borderTopColor: palette.borderSoft,
          borderTopWidth: 1,
          height: 62,
          paddingTop: 6,
        },
        tabBarActiveTintColor: palette.brand,
        tabBarInactiveTintColor: palette.muted,
        tabBarLabelStyle: { fontSize: 11, fontFamily: type.semibold, paddingBottom: 6 },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <Wordmark />,
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

const styles = StyleSheet.create({
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: {
    height: 26,
    width: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.brandSoft,
  },
  wordmarkText: { color: palette.foreground, fontSize: 19, fontFamily: type.display },
  wordmarkAccent: { color: palette.brand },
});
