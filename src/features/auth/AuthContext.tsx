// Auth Context - XELAY pattern
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { AuthContextType, AuthState } from '../../types/auth';

const STORAGE_KEY = '@myday_auth';

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// FCM Token'ı Firestore'a kaydet
async function saveFCMToken(userId: string) {
  try {
    // Expo Push Token al (Google Play Services gerektirmez)
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'f9465de2-a5fa-414a-9d65-25f0f836e120'
    });

    const fcmToken = token.data;
    console.log('[AuthContext] Native FCM Token:', fcmToken.substring(0, 20) + '...');

    // Firestore'da users/{userId} dokümanına fcmToken ekle
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { fcmToken }, { merge: true });

    console.log('[AuthContext] FCM Token Firestore\'a kaydedildi');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[AuthContext] FCM Token kaydetme hatası:', errorMessage, error);
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>(initialState);

  // Auth state listener
  useEffect(() => {
    console.log('[AuthContext] Listener started');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] State changed:', user ? `User: ${user.email}` : 'Logged out');
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ uid: user.uid }));
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        console.log('[AuthContext] State updated: authenticated');

        // FCM Token'ı Firestore'a kaydet
        await saveFCMToken(user.uid);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        console.log('[AuthContext] State updated: not authenticated');
      }
    });

    return unsubscribe;
  }, []);

  // Kayıt ol
  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  // Giriş yap
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged otomatik olarak isLoading: false yapacak
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  // Çıkış yap
  const signOut = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      await firebaseSignOut(auth);
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      const message = getErrorMessage(error);
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  // Hatayı temizle
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Firebase hata mesajlarını Türkçeye çevir
function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Bu e-posta adresi zaten kullanımda';
      case 'auth/invalid-email':
        return 'Geçersiz e-posta adresi';
      case 'auth/weak-password':
        return 'Şifre en az 6 karakter olmalı';
      case 'auth/user-not-found':
        return 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı';
      case 'auth/wrong-password':
        return 'Hatalı şifre';
      case 'auth/too-many-requests':
        return 'Çok fazla deneme yaptınız. Lütfen biraz bekleyin';
      case 'auth/network-request-failed':
        return 'İnternet bağlantısı hatası';
      default:
        return 'Bir hata oluştu. Lütfen tekrar deneyin';
    }
  }
  return 'Bir hata oluştu';
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
