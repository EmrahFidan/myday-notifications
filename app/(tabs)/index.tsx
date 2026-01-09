// Home Screen - Görev Listesi (Notion tarzı sürükle-bırak)
import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, GripVertical, Trash2 } from 'lucide-react-native';
import { toast } from 'sonner-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../../src/theme';
import { spacing, borderRadius } from '../../src/theme';
import { useAuth } from '../../src/features/auth';
import { useTasks, Task } from '../../src/features/tasks';
import { GlassCard, ProgressRing, Button } from '../../src/components/ui';

const TAB_BAR_HEIGHT = 70;

// Renkli görevler için palet
const TASK_COLORS = [
  '#8B5CF6', // Mor
  '#3B82F6', // Mavi
  '#10B981', // Yeşil
  '#F59E0B', // Turuncu
  '#EF4444', // Kırmızı
  '#EC4899', // Pembe
  '#14B8A6', // Turkuaz
  '#F97316', // Koyu turuncu
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const { user } = useAuth();
  const {
    dailyTasks,
    stats,
    isLoading,
    toggleTask,
    deleteTask,
    reorderTasks,
  } = useTasks();

  // Görevleri sırala: tamamlanmayanlar önce (order'a göre), tamamlananlar sona
  const sortedTasks = useMemo(() => {
    return [...dailyTasks].sort((a, b) => {
      // Önce tamamlanma durumuna göre (tamamlanmayanlar önce)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Sonra order'a göre
      return a.order - b.order;
    });
  }, [dailyTasks]);

  const handleToggleTask = useCallback(
    async (taskId: string) => {
      try {
        await toggleTask(taskId);
        const task = dailyTasks.find((t) => t.id === taskId);
        if (task && !task.completed) {
          toast.success('Görev tamamlandı!');
        }
      } catch (error) {
        toast.error('Bir hata oluştu');
      }
    },
    [toggleTask, dailyTasks]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        await deleteTask(taskId);
        toast.success('Görev silindi');
      } catch (error) {
        toast.error('Silinemedi');
      }
    },
    [deleteTask]
  );

  // Sürükle-bırak sonrası sıralamayı kaydet
  const handleDragEnd = useCallback(
    async ({ data }: { data: Task[] }) => {
      try {
        await reorderTasks(data);
      } catch (error) {
        toast.error('Sıralama kaydedilemedi');
      }
    },
    [reorderTasks]
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  // Notion tarzı görev item'ı
  const renderTaskItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Task>) => {
      // Her göreve order'ına göre farklı renk
      const taskColor = TASK_COLORS[item.order % TASK_COLORS.length];

      return (
        <ScaleDecorator>
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={drag}
            disabled={isActive}
            style={[
              styles.taskItem,
              {
                backgroundColor: isActive
                  ? colors.surfaceVariant
                  : colors.surface,
                borderColor: isActive ? colors.primary : taskColor,
                borderLeftWidth: 4,
                borderLeftColor: taskColor,
                opacity: item.completed ? 0.6 : 1,
              },
            ]}
          >
            {/* Drag Handle */}
            <TouchableOpacity
              onPressIn={drag}
              style={styles.dragHandle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <GripVertical size={18} color={colors.text.muted} />
            </TouchableOpacity>

            {/* Checkbox */}
            <TouchableOpacity
              onPress={() => handleToggleTask(item.id)}
              style={[
                styles.checkbox,
                {
                  borderColor: item.completed ? taskColor : taskColor,
                  backgroundColor: item.completed ? taskColor : 'transparent',
                },
              ]}
            >
              {item.completed && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>

            {/* Task Content */}
            <View style={styles.taskContent}>
              <Text
                style={[
                  styles.taskTitle,
                  typography.body,
                  {
                    color: colors.text.primary,
                    textDecorationLine: item.completed ? 'line-through' : 'none',
                  },
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              {item.description && (
                <Text
                  style={[
                    styles.taskDescription,
                    typography.bodySmall,
                    { color: colors.text.muted },
                  ]}
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              )}
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => handleDeleteTask(item.id)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    [colors, typography, handleToggleTask, handleDeleteTask]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, typography.h2, { color: colors.text.primary }]}>
        Bugün görev yok
      </Text>
      <Text style={[styles.emptySubtitle, typography.body, { color: colors.text.secondary }]}>
        Yeni bir görev ekleyerek başla!
      </Text>
      <Button
        title="Görev Ekle"
        onPress={() => router.push('/add-task')}
        style={{ marginTop: spacing['2xl'] }}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={[styles.greeting, typography.bodySmall, { color: colors.text.secondary }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.userName, typography.h2, { color: colors.text.primary }]}>
            {user?.displayName || 'Kullanıcı'}
          </Text>
        </View>
      </View>

      {/* Stats Card */}
      {dailyTasks.length > 0 && (
        <GlassCard variant="accent" style={styles.statsCard}>
          <View style={styles.statsContent}>
            <View style={styles.statsText}>
              <Text style={[styles.statsTitle, typography.h3, { color: colors.text.primary }]}>
                Bugünün İlerlemesi
              </Text>
              <Text style={[styles.statsSubtitle, typography.body, { color: colors.text.secondary }]}>
                {stats.completed} / {stats.total} görev tamamlandı
              </Text>
              {stats.completed > 0 && stats.completed < stats.total && (
                <Text style={[styles.motivationText, typography.bodySmall, { color: colors.primary }]}>
                  Harika gidiyorsun! 💪
                </Text>
              )}
              {stats.completed === stats.total && stats.total > 0 && (
                <Text style={[styles.motivationText, typography.bodySmall, { color: colors.success }]}>
                  Tüm görevler tamamlandı! 🎉
                </Text>
              )}
            </View>
            <ProgressRing progress={stats.completionRate} size={90} strokeWidth={10} />
          </View>
        </GlassCard>
      )}

      {/* Section Title with hint */}
      {dailyTasks.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, typography.h3, { color: colors.text.primary }]}>
            Görevlerin
          </Text>
          <Text style={[styles.dragHint, typography.caption, { color: colors.text.muted }]}>
            Sırala: basılı tut & sürükle
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <DraggableFlatList
          data={sortedTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          onDragEnd={handleDragEnd}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          activationDistance={10}
        />

        {/* FAB */}
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              bottom: TAB_BAR_HEIGHT + insets.bottom - 10, // Navbar'a daha yakın
            }
          ]}
          onPress={() => router.push('/add-task')}
          activeOpacity={0.8}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greeting: {},
  userName: {},
  statsCard: {
    marginBottom: spacing.lg,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    flex: 1,
    marginRight: spacing.lg,
  },
  statsTitle: {
    marginBottom: spacing.xs,
  },
  statsSubtitle: {},
  motivationText: {
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  clearButtonText: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {},
  dragHint: {
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyTitle: {
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  // Task Item Styles (Notion-like)
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  dragHandle: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  taskTitle: {
    fontWeight: '500',
  },
  taskDescription: {
    marginTop: 2,
  },
  deleteButton: {
    padding: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
