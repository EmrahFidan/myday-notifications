// Home Screen - Görev Listesi (Notion tarzı sürükle-bırak)
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, GripVertical, Trash2, AlertTriangle } from 'lucide-react-native';
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
import { GlassCard, Button } from '../../src/components/ui';

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
    isLoading,
    toggleTask,
    deleteTask,
    reorderTasks,
  } = useTasks();

  // Silme onay modalı için state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Gorevleri ayır: Tamamlanmayanlar ve tamamlananlar (ayrı listeler)
  const incompleteTasks = useMemo(() => {
    return dailyTasks.filter((t) => !t.completed).sort((a, b) => a.order - b.order);
  }, [dailyTasks]);

  const completedTasks = useMemo(() => {
    return dailyTasks.filter((t) => t.completed).sort((a, b) => a.order - b.order);
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

  // Silme onay modalını aç
  const confirmDeleteTask = useCallback((task: Task) => {
    setTaskToDelete(task);
    setDeleteModalVisible(true);
  }, []);

  // Silme işlemini gerçekleştir
  const handleConfirmDelete = useCallback(async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask(taskToDelete.id);
      toast.success('Görev silindi');
    } catch (error) {
      toast.error('Silinemedi');
    } finally {
      setDeleteModalVisible(false);
      setTaskToDelete(null);
    }
  }, [deleteTask, taskToDelete]);

  // Silme işlemini iptal et
  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
    setTaskToDelete(null);
  }, []);

  // Sürükle-bırak sonrası sıralamayı kaydet (tamamlanmayanlar bariyeri)
  const handleDragEnd = useCallback(
    async ({ data }: { data: Task[] }) => {
      try {
        // Tamamlanmamışların yeni sıralamasını kaydet
        await reorderTasks(data);
      } catch (error) {
        toast.error('Sıralama kaydedilemedi');
      }
    },
    [reorderTasks]
  );


  // Notion tarzı görev item'ı
  const renderTaskItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Task>) => {
      // Her göreve order'ına göre farklı renk
      const taskColor = TASK_COLORS[item.order % TASK_COLORS.length];
      const isCompleted = item.completed;

      return (
        <ScaleDecorator>
          <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={isCompleted ? undefined : drag}
            disabled={isActive || isCompleted}
            style={[
              styles.taskItem,
              {
                backgroundColor: isActive
                  ? colors.surfaceVariant
                  : colors.surface,
                borderColor: isActive ? colors.primary : taskColor,
                borderLeftWidth: 4,
                borderLeftColor: taskColor,
                opacity: isCompleted ? 0.5 : 1,
              },
            ]}
          >
            {/* Drag Handle - sadece tamamlanmamışlar için */}
            {!isCompleted ? (
              <TouchableOpacity
                onPressIn={drag}
                style={styles.dragHandle}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <GripVertical size={18} color={colors.text.muted} />
              </TouchableOpacity>
            ) : (
              <View style={styles.dragHandlePlaceholder} />
            )}

            {/* Checkbox */}
            <TouchableOpacity
              onPress={() => handleToggleTask(item.id)}
              style={[
                styles.checkbox,
                {
                  borderColor: taskColor,
                  backgroundColor: isCompleted ? taskColor : 'transparent',
                },
              ]}
            >
              {isCompleted && (
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
                    textDecorationLine: isCompleted ? 'line-through' : 'none',
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
              onPress={() => confirmDeleteTask(item)}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={16} color={colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        </ScaleDecorator>
      );
    },
    [colors, typography, handleToggleTask, confirmDeleteTask]
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
      {/* User Name */}
      <View style={styles.greetingRow}>
        <Text style={[styles.userName, typography.h2, { color: colors.text.primary }]}>
          {user?.displayName || 'Kullanici'}
        </Text>
      </View>

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

  // Tamamlanmış görevleri göster (footer - bariyer altı)
  const renderFooter = () => {
    if (completedTasks.length === 0) return null;

    return (
      <View style={styles.completedSection}>
        <View style={styles.completedDivider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, typography.caption, { color: colors.text.muted }]}>
            Tamamlanan Görevler
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>
        {completedTasks.map((item) => {
          const taskColor = TASK_COLORS[item.order % TASK_COLORS.length];
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              style={[
                styles.taskItem,
                {
                  backgroundColor: colors.surface,
                  borderColor: taskColor,
                  borderLeftWidth: 4,
                  borderLeftColor: taskColor,
                  opacity: 0.5,
                },
              ]}
            >
              {/* Boş alan (drag handle yerine) */}
              <View style={styles.dragHandlePlaceholder} />

              {/* Checkbox */}
              <TouchableOpacity
                onPress={() => handleToggleTask(item.id)}
                style={[
                  styles.checkbox,
                  {
                    borderColor: taskColor,
                    backgroundColor: taskColor,
                  },
                ]}
              >
                <Text style={styles.checkmark}>✓</Text>
              </TouchableOpacity>

              {/* Task Content */}
              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskTitle,
                    typography.body,
                    {
                      color: colors.text.primary,
                      textDecorationLine: 'line-through',
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
                onPress={() => confirmDeleteTask(item)}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 size={16} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <DraggableFlatList
          data={incompleteTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          onDragEnd={handleDragEnd}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
          ListFooterComponent={renderFooter}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          activationDistance={10}
        />

        {/* FAB - Sag ust */}
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              top: insets.top + 10,
            }
          ]}
          onPress={() => router.push('/add-task')}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Silme Onay Modalı */}
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          onRequestClose={handleCancelDelete}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalIconContainer, { backgroundColor: colors.error + '20' }]}>
                <AlertTriangle size={32} color={colors.error} />
              </View>
              <Text style={[styles.modalTitle, typography.h3, { color: colors.text.primary }]}>
                Görevi Sil
              </Text>
              <Text style={[styles.modalMessage, typography.body, { color: colors.text.secondary }]}>
                "{taskToDelete?.title}" görevini silmek istediğine emin misin?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                  onPress={handleCancelDelete}
                >
                  <Text style={[styles.modalButtonText, typography.bodyMedium, { color: colors.text.primary }]}>
                    Vazgeç
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteConfirmButton, { backgroundColor: colors.error }]}
                  onPress={handleConfirmDelete}
                >
                  <Text style={[styles.modalButtonText, typography.bodyMedium, { color: '#FFFFFF' }]}>
                    Sil
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  dragHandlePlaceholder: {
    width: 26,
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
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteConfirmButton: {},
  modalButtonText: {
    fontWeight: '600',
  },
  // Completed Section Styles (Bariyer Altı)
  completedSection: {
    marginTop: spacing.xl,
  },
  completedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
