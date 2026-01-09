// Auth Screen - Giriş / Kayıt
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { useTheme } from '../src/theme';
import { spacing } from '../src/theme';
import { useAuth } from '../src/features/auth';
import { GlassCard, Button, Input } from '../src/components/ui';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const { signIn, signUp, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Giriş yapılmışsa ana sayfaya yönlendir (loading bitince)
  useEffect(() => {
    console.log('🟢 [auth.tsx] Auth state:', { isAuthenticated, isLoading });
    if (isAuthenticated && !isLoading) {
      console.log('🟢 [auth.tsx] Redirect ediliyor: /(tabs)');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router]);

  // Hata mesajını göster
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const validateForm = useCallback((): boolean => {
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('E-posta adresi gerekli');
      return false;
    }

    if (!email.includes('@')) {
      setLocalError('Geçerli bir e-posta adresi girin');
      return false;
    }

    if (!password.trim()) {
      setLocalError('Şifre gerekli');
      return false;
    }

    if (password.length < 6) {
      setLocalError('Şifre en az 6 karakter olmalı');
      return false;
    }

    if (mode === 'register' && !displayName.trim()) {
      setLocalError('İsim gerekli');
      return false;
    }

    return true;
  }, [email, password, displayName, mode]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        toast.success('Hoş geldin!');
      } else {
        await signUp(email.trim(), password, displayName.trim());
        toast.success('Hesap oluşturuldu!');
      }
    } catch (error) {
      // Hata zaten AuthContext tarafından yönetiliyor
    }
  }, [mode, email, password, displayName, signIn, signUp, validateForm]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setLocalError(null);
    clearError();
  }, [clearError]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, typography.h1, { color: colors.primary }]}>
              MYday
            </Text>
            <Text style={[styles.tagline, typography.body, { color: colors.text.secondary }]}>
              Günlük görevlerini takip et
            </Text>
          </View>

          {/* Form Card */}
          <GlassCard variant="accent" style={styles.formCard}>
            <Text style={[styles.formTitle, typography.h2, { color: colors.text.primary }]}>
              {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
            </Text>

            {mode === 'register' && (
              <Input
                label="İsim"
                placeholder="Adınız"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
                autoComplete="name"
              />
            )}

            <Input
              label="E-posta"
              placeholder="ornek@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Input
              label="Şifre"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'login' ? 'password' : 'new-password'}
            />

            {localError && (
              <Text style={[styles.errorText, typography.bodySmall, { color: colors.error }]}>
                {localError}
              </Text>
            )}

            <Button
              title={mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
              onPress={handleSubmit}
              loading={isLoading}
              fullWidth
              style={styles.submitButton}
            />

            <TouchableOpacity onPress={toggleMode} style={styles.toggleButton}>
              <Text style={[styles.toggleText, typography.body, { color: colors.text.secondary }]}>
                {mode === 'login' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
                </Text>
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  tagline: {
    marginTop: spacing.sm,
  },
  formCard: {
    padding: spacing['2xl'],
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  errorText: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  toggleButton: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  toggleText: {
    textAlign: 'center',
  },
});
