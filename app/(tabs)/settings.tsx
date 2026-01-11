// Settings Screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut,
  ChevronRight,
  User,
  Bell,
  Clock,
  Trash2,
  Info,
  ListOrdered,
  Copy,
} from 'lucide-react-native';
import { toast } from 'sonner-native';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../../src/theme';
import { spacing, borderRadius } from '../../src/theme';
import { useAuth } from '../../src/features/auth';
import { GlassCard } from '../../src/components/ui';
import { notificationService } from '../../src/services/notificationService';

const TAB_BAR_HEIGHT = 70;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Cikis Yap',
      'Hesabindan cikis yapmak istedigine emin misin?',
      [
        { text: 'Iptal', style: 'cancel' },
        {
          text: 'Cikis Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.clearAllNotifications();
              await signOut();
              toast.success('Cikis yapildi');
            } catch (error) {
              toast.error('Cikis yapilirken hata olustu');
            }
          },
        },
      ]
    );
  };

  const handleShowFCMToken = async () => {
    try {
      // Native FCM token al
      const token = await Notifications.getDevicePushTokenAsync();

      const fcmToken = token.data;

      Alert.alert(
        'FCM Token',
        fcmToken,
        [
          { text: 'Iptal', style: 'cancel' },
          {
            text: 'Kopyala',
            onPress: () => {
              Clipboard.setString(fcmToken);
              toast.success('Token kopyalandi');
            },
          },
        ]
      );
    } catch (error) {
      toast.error('Token alinamadi');
      console.error(error);
    }
  };

  const SettingsItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    rightElement,
    destructive = false,
  }: {
    icon: React.ElementType;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceVariant }]}>
        <Icon size={20} color={destructive ? colors.error : colors.primary} />
      </View>
      <View style={styles.settingsItemText}>
        <Text
          style={[
            styles.settingsItemTitle,
            typography.bodyMedium,
            { color: destructive ? colors.error : colors.text.primary },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.settingsItemSubtitle,
              typography.caption,
              { color: colors.text.muted },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (onPress && <ChevronRight size={20} color={colors.text.muted} />)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.title, typography.h1, { color: colors.text.primary }]}>
          Ayarlar
        </Text>

        {/* Profile Section */}
        <GlassCard style={styles.section}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <User size={32} color="#FFFFFF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, typography.h3, { color: colors.text.primary }]}>
                {user?.displayName || 'Kullanici'}
              </Text>
              <Text style={[styles.profileEmail, typography.bodySmall, { color: colors.text.secondary }]}>
                {user?.email}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Bildirim Ayarları */}
        <Text style={[styles.sectionTitle, typography.label, { color: colors.text.secondary }]}>
          Bildirimler
        </Text>
        <GlassCard style={styles.section}>
          <SettingsItem
            icon={Bell}
            title="Bildirim Durumu"
            subtitle="Aktif - Firebase Cloud Messaging"
          />
          <SettingsItem
            icon={Clock}
            title="Bildirim Sıklığı"
            subtitle="Her 7 dakikada bir (GitHub Actions)"
          />
          <SettingsItem
            icon={Copy}
            title="FCM Token Göster"
            subtitle="Token'ı göster ve kopyala"
            onPress={handleShowFCMToken}
          />
        </GlassCard>

        {/* Görev Ayarları */}
        <Text style={[styles.sectionTitle, typography.label, { color: colors.text.secondary }]}>
          Görev Yönetimi
        </Text>
        <GlassCard style={styles.section}>
          <SettingsItem
            icon={Trash2}
            title="Otomatik Silme"
            subtitle="Tamamlanmış görevler 48 saat sonra silinir"
          />
          <SettingsItem
            icon={ListOrdered}
            title="Yeni Görev Pozisyonu"
            subtitle="En üste eklenir"
          />
        </GlassCard>

        {/* Uygulama Bilgileri */}
        <Text style={[styles.sectionTitle, typography.label, { color: colors.text.secondary }]}>
          Uygulama Bilgileri
        </Text>
        <GlassCard style={styles.section}>
          <SettingsItem
            icon={Info}
            title="Versiyon"
            subtitle="1.0.0"
          />
          <SettingsItem
            icon={Info}
            title="Platform"
            subtitle="React Native + Expo"
          />
          <SettingsItem
            icon={Info}
            title="Backend"
            subtitle="Firebase (Firestore + FCM)"
          />
        </GlassCard>

        {/* Account Section */}
        <Text style={[styles.sectionTitle, typography.label, { color: colors.text.secondary }]}>
          Hesap
        </Text>
        <GlassCard style={styles.section}>
          <SettingsItem
            icon={LogOut}
            title="Cikis Yap"
            onPress={handleSignOut}
            destructive
          />
        </GlassCard>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appName, typography.bodyMedium, { color: colors.text.muted }]}>
            MYday
          </Text>
          <Text style={[styles.appVersion, typography.caption, { color: colors.text.muted }]}>
            Versiyon 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing['2xl'],
  },
  section: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  profileName: {},
  profileEmail: {
    marginTop: spacing.xs,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsItemText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingsItemTitle: {},
  settingsItemSubtitle: {
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
  },
  appName: {
    fontWeight: '600',
  },
  appVersion: {
    marginTop: spacing.xs,
  },
});
