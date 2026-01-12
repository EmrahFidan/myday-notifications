// Root Layout - MYday
import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
  const { colors } = useTheme();

  return (
    <>
      <StatusBar style="light" />
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

  // Bildirim izinlerini iste ve FCM dinleyici kur
  useEffect(() => {
    if (!notificationInitialized.current) {
      notificationInitialized.current = true;

      // Bildirim izinlerini iste
      notificationService.requestPermissions().catch(console.error);

      // Handler: Bildirim geldiğinde ÖNCE ESKİLERİ SİL, SONRA YENİSİNİ GÖSTER
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          const data = notification.request.content.data;

          // FCM task_update mesajı mı?
          if (data?.type === 'task_update') {
            console.log('📬 FCM mesajı alındı, önce eski bildirimler siliniyor...');

            // 1. Önce mevcut TÜM bildirimleri sil
            await Notifications.dismissAllNotificationsAsync();

            // 2. Sonra yeni bildirimi göster (sabit ID)
            await Notifications.scheduleNotificationAsync({
              identifier: 'myday-persistent',
              content: {
                title: (data.title as string) || notification.request.content.title || 'MYday',
                body: (data.body as string) || notification.request.content.body || '',
                sound: false,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: null,
            });

            console.log('✅ Yeni bildirim gösterildi');

            // FCM'in kendi bildirimini gösterme (biz zaten gösterdik)
            return {
              shouldShowAlert: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
            };
          }

          // Diğer bildirimler için normal göster
          return {
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: true,
          };
        },
      });
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
