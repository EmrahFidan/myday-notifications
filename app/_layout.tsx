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

// Sabit bildirim ID - aynı bildirim sürekli güncellenir
const PERSISTENT_NOTIFICATION_ID = 'myday-task-notification';

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

  // Bildirim izinlerini iste ve FCM mesajlarını dinle
  useEffect(() => {
    if (!notificationInitialized.current) {
      notificationInitialized.current = true;

      // Bildirim izinlerini iste
      notificationService.requestPermissions().catch(console.error);

      // FCM otomatik bildirimlerini engelle - sadece bizim local notification'ımız gösterilsin
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: false,  // FCM otomatik bildirimi gösterme!
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      // FCM data mesajlarını dinle (foreground & background)
      const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('📬 FCM data mesajı alındı:', notification);

        // Data payload'dan bildirim oluştur
        if (notification.request.content.data?.title) {
          const title = notification.request.content.data.title as string;
          const body = notification.request.content.data.body as string;

          // PERSISTENT_NOTIFICATION_ID ile bildirim göster - eskisi otomatik replace edilir
          (async () => {
            try {
              // Önce bu ID'deki bildirimi dismiss et
              await Notifications.dismissNotificationAsync(PERSISTENT_NOTIFICATION_ID);

              // Sonra aynı ID ile yeni bildirim göster
              await Notifications.scheduleNotificationAsync({
                identifier: PERSISTENT_NOTIFICATION_ID,
                content: {
                  title: title,
                  body: body,
                  sound: false,
                  priority: Notifications.AndroidNotificationPriority.HIGH,
                  ...(Platform.OS === 'android' && {
                    channelId: 'persistent',
                  }),
                },
                trigger: null,
              });
            } catch (error) {
              console.error('Bildirim gösterme hatası:', error);
            }
          })();
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
