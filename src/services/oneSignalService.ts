// OneSignal Push Notification Service
import { OneSignal } from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task';

const ONESIGNAL_APP_ID = 'da145e4e-f947-4aba-8911-8dc8bdf6431e';
const PLAYER_ID_KEY = '@myday_onesignal_player_id';
const TASKS_STORAGE_KEY = '@myday_tasks_for_notification';

class OneSignalService {
  private isInitialized = false;
  private playerId: string | null = null;

  // OneSignal'i başlat
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ OneSignal zaten başlatılmış');
      return;
    }

    try {
      console.log('🚀 OneSignal başlatılıyor...');

      // OneSignal'i başlat
      OneSignal.initialize(ONESIGNAL_APP_ID);

      // Push notification izni iste
      OneSignal.Notifications.requestPermission(true);

      // Debug modunu aktif et (development için)
      OneSignal.Debug.setLogLevel(6);

      // Player ID değişikliklerini dinle
      OneSignal.User.pushSubscription.addEventListener('change', (subscription) => {
        console.log('📱 OneSignal Subscription:', subscription);
        if (subscription.current.id) {
          this.playerId = subscription.current.id;
          AsyncStorage.setItem(PLAYER_ID_KEY, subscription.current.id);
          console.log('✅ Player ID kaydedildi:', this.playerId);
        }
      });

      // Bildirim tıklamalarını dinle
      OneSignal.Notifications.addEventListener('click', (event) => {
        console.log('🔔 Bildirim tıklandı:', event);
      });

      // Bildirim alındığında (foreground)
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
        console.log('📬 Bildirim alındı (foreground):', event);
        // Bildirimi göster
        event.preventDefault();
        event.getNotification().display();
      });

      // Mevcut Player ID'yi al
      const currentId = OneSignal.User.pushSubscription.getPushSubscriptionId();
      if (currentId) {
        this.playerId = currentId;
        await AsyncStorage.setItem(PLAYER_ID_KEY, currentId);
        console.log('✅ Mevcut Player ID:', this.playerId);
      }

      this.isInitialized = true;
      console.log('✅ OneSignal başarıyla başlatıldı');
    } catch (error) {
      console.error('❌ OneSignal başlatma hatası:', error);
    }
  }

  // Player ID'yi al
  getPlayerId(): string | null {
    return this.playerId;
  }

  // Görev listesini formatla
  private formatTaskList(tasks: Task[]): string {
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.completed === b.completed) return a.order - b.order;
      return a.completed ? 1 : -1;
    });

    const incompleteTasks = sortedTasks.filter(t => !t.completed);
    const completedTasks = sortedTasks.filter(t => t.completed);

    const lines: string[] = [];

    incompleteTasks.slice(0, 5).forEach(task => {
      lines.push(`☐ ${task.title}`);
    });

    const remainingSlots = 5 - Math.min(incompleteTasks.length, 5);
    completedTasks.slice(0, remainingSlots).forEach(task => {
      lines.push(`☑ ${task.title}`);
    });

    const totalShown = Math.min(incompleteTasks.length, 5) + Math.min(completedTasks.length, remainingSlots);
    const remainingCount = tasks.length - totalShown;
    if (remainingCount > 0) {
      lines.push(`+${remainingCount} görev daha...`);
    }

    return lines.join('\n');
  }

  // Görevleri kaydet (bildirim içeriği için)
  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      console.log('📝 Görevler kaydedildi');
    } catch (error) {
      console.error('Görev kaydetme hatası:', error);
    }
  }

  // Tag'leri güncelle (OneSignal segment için)
  async updateTags(tasks: Task[]): Promise<void> {
    try {
      const incompleteTasks = tasks.filter(t => !t.completed);
      const taskContent = this.formatTaskList(tasks);

      // OneSignal tag'lerini güncelle
      OneSignal.User.addTags({
        has_tasks: incompleteTasks.length > 0 ? 'true' : 'false',
        task_count: String(incompleteTasks.length),
        task_content: taskContent.substring(0, 250), // OneSignal tag limiti
      });

      console.log('🏷️ OneSignal tag\'leri güncellendi');
    } catch (error) {
      console.error('Tag güncelleme hatası:', error);
    }
  }

  // Test bildirimi gönder (sadece bu cihaza)
  async sendTestNotification(): Promise<void> {
    if (!this.playerId) {
      console.log('❌ Player ID yok, test bildirimi gönderilemez');
      return;
    }

    console.log('📤 Test bildirimi gönderiliyor...');
    console.log('Player ID:', this.playerId);

    // Not: Push notification göndermek için OneSignal REST API kullanılmalı
    // Bu fonksiyon sadece debug amaçlıdır
  }

  // Başlatıldı mı?
  isReady(): boolean {
    return this.isInitialized;
  }
}

export const oneSignalService = new OneSignalService();
export default oneSignalService;
