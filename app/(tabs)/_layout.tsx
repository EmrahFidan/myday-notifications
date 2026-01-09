// Tab Layout - MYday
import React from 'react';
import { Tabs } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Home, Settings } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/features/auth';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  console.log('[tabs/_layout] Auth state:', { isAuthenticated, isLoading });

  // Auth yükleniyor - loading göster
  if (isLoading) {
    console.log('[tabs/_layout] Loading');
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Giriş yapılmamış
  if (!isAuthenticated) {
    console.log('[tabs/_layout] Not authenticated, redirecting to auth');
    return <Redirect href="/auth" />;
  }

  console.log('[tabs/_layout] Showing tabs');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true, // Klavye açıldığında navbar gizle
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 70 + insets.bottom, // Tuş takımı için alan ekle
          paddingBottom: insets.bottom + 10, // Alt tuş takımından uzak tut
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Görevler',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
