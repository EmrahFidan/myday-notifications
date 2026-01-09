// Tab Layout - MYday
import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Settings } from 'lucide-react-native';
import { useTheme } from '../../src/theme';
import { useAuth } from '../../src/features/auth';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  // Auth yükleniyor
  if (isLoading) {
    return null;
  }

  // Giriş yapılmamış
  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

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
