// Tasks Context - Görev yönetimi ve bildirim entegrasyonu
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Task, CreateTaskInput, UpdateTaskInput } from '../../types/task';
import { taskService } from '../../services/taskService';
import { notificationService } from '../../services/notificationService';
import { useAuth } from '../auth';

interface TasksState {
  tasks: Task[];
  dailyTasks: Task[];
  isLoading: boolean;
  error: string | null;
}

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

interface TasksContextType extends TasksState {
  stats: TaskStats;
  addTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (taskId: string, input: UpdateTaskInput) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  reorderTasks: (tasks: Task[]) => Promise<void>;
  refreshTasks: () => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

interface TasksProviderProps {
  children: ReactNode;
}

export const TasksProvider: React.FC<TasksProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<TasksState>({
    tasks: [],
    dailyTasks: [],
    isLoading: true,
    error: null,
  });

  // İstatistikleri hesapla
  const stats = useMemo<TaskStats>(() => {
    const dailyTasks = state.dailyTasks;
    const total = dailyTasks.length;
    const completed = dailyTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, completionRate };
  }, [state.dailyTasks]);

  // Badge count güncelle (OneSignal kaldırıldı - Firestore'dan direkt okunuyor)
  const updatePersistentNotification = useCallback(async (tasks: Task[]) => {
    const incompleteTasks = tasks.filter((t) => !t.completed);

    // Sadece badge count güncelle
    if (incompleteTasks.length === 0 && tasks.length > 0) {
      await notificationService.updateBadgeCount(0);
    } else if (incompleteTasks.length > 0) {
      await notificationService.updateBadgeCount(incompleteTasks.length);
    }
  }, []);

  // Görevleri dinle
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setState((prev) => ({ ...prev, tasks: [], dailyTasks: [], isLoading: false }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    // Günlük görevleri dinle
    const unsubscribe = taskService.subscribeToDailyTasks(
      user.uid,
      (tasks) => {
        setState((prev) => ({
          ...prev,
          dailyTasks: tasks,
          isLoading: false,
          error: null,
        }));
        // Persistent notification'ı güncelle
        updatePersistentNotification(tasks);
      },
      (error) => {
        console.error('Görev yükleme hatası:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Görevler yüklenirken hata oluştu',
        }));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, user, updatePersistentNotification]);

  // App state değişikliklerini dinle
  // NOT: Uygulama ön plana geldiğinde bildirim güncellemesi YAPMA
  // çünkü Firestore listener zaten tetiklenecek ve updatePersistentNotification çağrılacak
  // Bu duplicate çağrıları önler

  // Yeni görev ekle
  const addTask = useCallback(
    async (input: CreateTaskInput) => {
      if (!user) throw new Error('Giriş yapmalısınız');

      try {
        await taskService.addTask(user.uid, input);
        // Artık local bildirim planlaması yok, sadece GitHub Actions FCM
      } catch (error) {
        console.error('Görev ekleme hatası:', error);
        throw error;
      }
    },
    [user]
  );

  // Görevi güncelle
  const updateTask = useCallback(
    async (taskId: string, input: UpdateTaskInput) => {
      if (!user) throw new Error('Giriş yapmalısınız');

      try {
        await taskService.updateTask(user.uid, taskId, input);
      } catch (error) {
        console.error('Görev güncelleme hatası:', error);
        throw error;
      }
    },
    [user]
  );

  // Görevi tamamla/geri al
  const toggleTask = useCallback(
    async (taskId: string) => {
      if (!user) throw new Error('Giriş yapmalısınız');

      const task = state.dailyTasks.find((t) => t.id === taskId);
      if (!task) return;

      try {
        await taskService.toggleTask(user.uid, taskId, !task.completed);
      } catch (error) {
        console.error('Görev toggle hatası:', error);
        throw error;
      }
    },
    [user, state.dailyTasks]
  );

  // Görevi sil
  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!user) throw new Error('Giriş yapmalısınız');

      try {
        await taskService.deleteTask(user.uid, taskId);
      } catch (error) {
        console.error('Görev silme hatası:', error);
        throw error;
      }
    },
    [user]
  );

  // Tamamlanmış görevleri temizle
  const clearCompleted = useCallback(async () => {
    if (!user) throw new Error('Giriş yapmalısınız');

    try {
      await taskService.clearCompletedTasks(user.uid);
    } catch (error) {
      console.error('Görev temizleme hatası:', error);
      throw error;
    }
  }, [user]);

  // Görevleri yeniden sırala (sürükle-bırak)
  const reorderTasks = useCallback(
    async (reorderedTasks: Task[]) => {
      if (!user) throw new Error('Giriş yapmalısınız');

      try {
        // Yeni sıralamayı oluştur
        const taskOrders = reorderedTasks.map((task, index) => ({
          id: task.id,
          order: index,
        }));

        // Firestore'a kaydet
        await taskService.reorderTasks(user.uid, taskOrders);
      } catch (error) {
        console.error('Sıralama hatası:', error);
        throw error;
      }
    },
    [user]
  );

  // Manuel yenileme
  const refreshTasks = useCallback(() => {
    // Firestore real-time listener zaten aktif, bu sadece re-render tetikler
    setState((prev) => ({ ...prev }));
  }, []);

  const value: TasksContextType = {
    ...state,
    stats,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    clearCompleted,
    reorderTasks,
    refreshTasks,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

export const useTasks = (): TasksContextType => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};

export default TasksContext;
