// Notification Service - Scheduled Notifications with Debounce
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Task } from '../types/task';

const TASKS_STORAGE_KEY = '@myday_tasks_for_notification';
const NOTIFICATION_ID = 'myday-task-notification';
const SCHEDULING_LOCK_KEY = '@myday_scheduling_lock';
const LAST_TASK_HASH_KEY = '@myday_last_task_hash';

// Notification ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private isInitialized = false;
  private isScheduling = false; // In-memory lock to prevent concurrent scheduling
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingTasks: Task[] | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Bildirim izni verilmedi');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('tasks', {
          name: 'Görevler',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8B5CF6',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
          enableLights: true,
          enableVibrate: false,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('persistent', {
          name: 'Görev Listesi',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0],
          lightColor: '#8B5CF6',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          enableLights: false,
          enableVibrate: false,
          showBadge: false,
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Bildirim izni hatası:', error);
      return false;
    }
  }

  private formatTaskList(tasks: Task[]): string {
    const sortedTasks = [...tasks].sort((a, b) => {
      if (a.completed === b.completed) return a.order - b.order;
      return a.completed ? 1 : -1;
    });

    const incompleteTasks = sortedTasks.filter(t => !t.completed);
    const completedTasks = sortedTasks.filter(t => t.completed);

    const lines: string[] = [];

    incompleteTasks.slice(0, 5).forEach(task => {
      lines.push(`☐  ${task.title}`);
    });

    const remainingSlots = 5 - Math.min(incompleteTasks.length, 5);
    completedTasks.slice(0, remainingSlots).forEach(task => {
      const strikeText = task.title.split('').map(c => c + '\u0336').join('');
      lines.push(`☑  ${strikeText}`);
    });

    const totalShown = Math.min(incompleteTasks.length, 5) + Math.min(completedTasks.length, remainingSlots);
    const remainingCount = tasks.length - totalShown;
    if (remainingCount > 0) {
      lines.push(`+${remainingCount} görev daha...`);
    }

    return lines.join('\n');
  }

  // Task listesinin hash'ini oluştur (değişiklik kontrolü için)
  // Görevleri ID'ye göre sırala ki sıra değişse bile hash aynı kalsın
  private createTaskHash(tasks: Task[]): string {
    const sortedTasks = [...tasks].sort((a, b) => a.id.localeCompare(b.id));
    const hashData = sortedTasks.map(t => `${t.id}:${t.completed}`).join('|');
    return hashData;
  }

  // Görev listesi değişti mi kontrol et
  private async hasTasksChanged(tasks: Task[]): Promise<boolean> {
    const currentHash = this.createTaskHash(tasks);
    const lastHash = await AsyncStorage.getItem(LAST_TASK_HASH_KEY);

    console.log(`🔍 Hash kontrolü: mevcut="${currentHash.substring(0, 50)}..." önceki="${lastHash?.substring(0, 50) || 'yok'}..."`);

    if (currentHash !== lastHash) {
      await AsyncStorage.setItem(LAST_TASK_HASH_KEY, currentHash);
      console.log('✅ Görev listesi değişti, yeniden planlanacak');
      return true;
    }
    console.log('⏭️ Görev listesi aynı, planlama atlanacak');
    return false;
  }

  // Tüm planlanmış bildirimleri iptal et
  private async cancelScheduledNotifications(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`Mevcut planlanmış bildirim sayısı: ${scheduled.length}`);

      for (const notification of scheduled) {
        if (notification.identifier.startsWith('myday-')) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      console.error('İptal hatası:', error);
    }
  }

  // Bildirimleri planla - 1 saat boyunca her 1 dakikada bir (60 bildirim)
  // Bu fonksiyon SADECE scheduleNotificationsWithLock tarafından çağrılmalı!
  private async doScheduleNotifications(tasks: Task[]): Promise<void> {
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) {
      console.log('Tamamlanmamış görev yok, bildirim planlanmadı');
      return;
    }

    // Önce eskileri iptal et
    await this.cancelScheduledNotifications();

    const taskList = this.formatTaskList(tasks);
    const intervalMs = 60 * 1000; // 1 dakika
    const count = 60; // 1 saat

    console.log(`⏰ ${count} bildirim planlanıyor...`);

    // İlk birkaç bildirimin zamanını logla
    const now = new Date();
    console.log(`🕐 Şu anki zaman: ${now.toLocaleTimeString()}`);

    let scheduled = 0;
    for (let i = 1; i <= count; i++) {
      const triggerTime = new Date(Date.now() + (i * intervalMs));

      // İlk 3 bildirimin zamanını göster
      if (i <= 3) {
        console.log(`📅 Bildirim ${i}: ${triggerTime.toLocaleTimeString()}`);
      }

      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `myday-${i}`,
          content: {
            title: 'MYday - Görevlerin',
            body: taskList,
            sound: false,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            ...(Platform.OS === 'android' && {
              channelId: 'persistent',
            }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerTime,
          },
        });
        scheduled++;
      } catch (error) {
        console.error(`Bildirim ${i} hatası:`, error);
      }
    }

    console.log(`✅ ${scheduled} bildirim planlandı!`);

    // Kontrol et
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const mydayNotifs = all.filter(n => n.identifier.startsWith('myday-'));
    console.log(`📊 Toplam MYday bildirimi: ${mydayNotifs.length}`);

    // İlk birkaç planlanmış bildirimi göster
    if (mydayNotifs.length > 0) {
      const sorted = mydayNotifs.sort((a, b) => {
        const dateA = a.trigger && 'date' in a.trigger ? new Date(a.trigger.date).getTime() : 0;
        const dateB = b.trigger && 'date' in b.trigger ? new Date(b.trigger.date).getTime() : 0;
        return dateA - dateB;
      });

      console.log('📋 İlk 3 planlanmış bildirim:');
      sorted.slice(0, 3).forEach((n, i) => {
        if (n.trigger && 'date' in n.trigger) {
          const date = new Date(n.trigger.date);
          console.log(`  ${i + 1}. ${n.identifier} → ${date.toLocaleTimeString()}`);
        }
      });
    }
  }

  // Lock ile scheduling - duplicate çağrıları önler (hash kontrolü dışarıda yapılır)
  private async scheduleNotificationsWithLockInternal(tasks: Task[]): Promise<void> {
    // In-memory lock kontrolü
    if (this.isScheduling) {
      console.log('⏳ Zaten planlama yapılıyor, atlandı');
      return;
    }

    try {
      this.isScheduling = true;
      console.log('🔒 Planlama kilidi alındı');

      await this.doScheduleNotifications(tasks);

    } finally {
      this.isScheduling = false;
      console.log('🔓 Planlama kilidi bırakıldı');
    }
  }

  // Public wrapper - hash kontrolü ile (initializeOnAppStart için)
  private async scheduleNotificationsWithLock(tasks: Task[]): Promise<void> {
    const hasChanged = await this.hasTasksChanged(tasks);
    if (!hasChanged) {
      return;
    }
    await this.scheduleNotificationsWithLockInternal(tasks);
  }

  // DEVRE DIŞI - Artık sadece FCM kullanılıyor
  async showPersistentNotification(tasks: Task[]): Promise<void> {
    // Hiçbir şey yapma, FCM kullanıyoruz
    return;
  }

  // Asıl bildirim gösterme işlemi (debounce sonrası çağrılır)
  private async doShowPersistentNotification(): Promise<void> {
    const tasks = this.pendingTasks;
    if (!tasks) return;

    this.pendingTasks = null;

    if (!this.isInitialized) {
      const granted = await this.requestPermissions();
      if (!granted) return;
    }

    const incompleteTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    if (incompleteTasks.length === 0 && completedTasks.length > 0) {
      await this.dismissPersistentNotification();
      await this.showCompletionNotification();
      await AsyncStorage.removeItem(TASKS_STORAGE_KEY);
      await AsyncStorage.removeItem(LAST_TASK_HASH_KEY);
      return;
    }

    if (tasks.length === 0) {
      await this.dismissPersistentNotification();
      await AsyncStorage.removeItem(TASKS_STORAGE_KEY);
      await AsyncStorage.removeItem(LAST_TASK_HASH_KEY);
      return;
    }

    // Hash kontrolü - değişmediyse sadece anlık bildirim göster, scheduling yapma
    const hasChanged = await this.hasTasksChanged(tasks);

    // Görevleri kaydet (her durumda)
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));

    const taskList = this.formatTaskList(tasks);

    try {
      // Hemen bir bildirim göster
      await Notifications.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          body: taskList,
          sound: false,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          ...(Platform.OS === 'android' && {
            channelId: 'persistent',
          }),
        },
        trigger: null,
      });

      console.log('📱 Anlık bildirim gönderildi');

      // SADECE görev listesi değiştiyse yeniden planla
      if (hasChanged) {
        await this.scheduleNotificationsWithLockInternal(tasks);
      } else {
        console.log('📋 Görev listesi değişmedi, scheduling atlandı');
      }

    } catch (error) {
      console.error('Bildirim hatası:', error);
    }
  }

  async dismissPersistentNotification(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.cancelScheduledNotifications();
    } catch (error) {
      console.error('Bildirim kapatma hatası:', error);
    }
  }

  async showCompletionNotification(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Tebrikler!',
          body: 'Bugünkü tüm görevlerini tamamladın!',
          sound: true,
          ...(Platform.OS === 'android' && {
            channelId: 'tasks',
          }),
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Tamamlama bildirimi hatası:', error);
    }
  }

  async scheduleTaskReminder(task: Task): Promise<string | null> {
    if (!this.isInitialized || !task.reminderTime) return null;

    try {
      const trigger = new Date(task.reminderTime);
      if (trigger <= new Date()) return null;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Görev Hatırlatıcı',
          body: task.title,
          data: { taskId: task.id, type: 'reminder' },
          sound: true,
          ...(Platform.OS === 'android' && {
            channelId: 'tasks',
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
        },
      });

      return id;
    } catch (error) {
      console.error('Hatırlatıcı hatası:', error);
      return null;
    }
  }

  async cancelTaskReminder(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Hatırlatıcı iptal hatası:', error);
    }
  }

  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Temizleme hatası:', error);
    }
  }

  async updateBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Badge hatası:', error);
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // Uygulama başlatıldığında çağrılır
  // DEVRE DIŞI - Artık sadece FCM kullanılıyor
  async initializeOnAppStart(): Promise<void> {
    // Hiçbir şey yapma, FCM kullanıyoruz
    return;
  }

  // Debug: Planlanmış bildirimleri listele
  async debugListScheduledNotifications(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('=== Planlanmış Bildirimler ===');
    console.log(`Toplam: ${scheduled.length}`);

    const mydayNotifications = scheduled.filter(n => n.identifier.startsWith('myday-'));
    console.log(`MYday bildirimleri: ${mydayNotifications.length}`);

    if (mydayNotifications.length > 0) {
      const first = mydayNotifications[0];
      const last = mydayNotifications[mydayNotifications.length - 1];
      console.log(`İlk bildirim: ${first.identifier}`);
      console.log(`Son bildirim: ${last.identifier}`);
    }
    console.log('==============================');
  }
}

export const notificationService = new NotificationService();
export default notificationService;
