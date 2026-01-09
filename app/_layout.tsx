// Root Layout - MYday
import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import { Toaster } from 'sonner-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme';
import { AuthProvider } from '../src/features/auth';
import { TasksProvider } from '../src/features/tasks';
import { notificationService } from '../src/services/notificationService';
import * as Notifications from 'expo-notifications';

// Splash screen'i göster
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="add-task"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <Toaster position="top-center" />
    </>
  );
}

export default function RootLayout() {
  const notificationInitialized = useRef(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Bildirim izinlerini iste ve FCM mesajlarını dinle
  useEffect(() => {
    if (!notificationInitialized.current) {
      notificationInitialized.current = true;

      // Bildirim izinlerini iste (badge count için)
      notificationService.requestPermissions().catch(console.error);

      // FCM data mesajlarını dinle (foreground)
      const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('📬 FCM data mesajı alındı:', notification);

        // Eğer data payload varsa, özel bildirim göster
        if (notification.request.content.data?.tasks) {
          const tasks = JSON.parse(notification.request.content.data.tasks as string);
          const taskList = tasks.join('\n'); // Array'i newline ile birleştir
          const incompleteCount = notification.request.content.data.incompleteCount as number;

          // Özel bildirim göster (tüm görevler görünür olacak)
          Notifications.scheduleNotificationAsync({
            content: {
              title: `MYday (${incompleteCount} görev)`,
              body: taskList,
              sound: false,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              ...(Platform.OS === 'android' && {
                channelId: 'persistent',
              }),
            },
            trigger: null, // Hemen göster
          }).catch(console.error);
        }
      });

      return () => {
        foregroundSubscription.remove();
      };
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <TasksProvider>
              <RootLayoutNav />
            </TasksProvider>
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
  },
});
