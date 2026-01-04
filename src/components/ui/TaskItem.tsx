// TaskItem Component - Görev listesi elemanı
import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Circle, CheckCircle2, Trash2, Clock } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { borderRadius, spacing } from '../../theme';
import { Task, CATEGORY_INFO, PRIORITY_INFO } from '../../features/tasks';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onPress?: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggle,
  onDelete,
  onPress,
}) => {
  const { colors, typography, glassStyle, isDark } = useTheme();

  const categoryInfo = CATEGORY_INFO[task.category];
  const priorityInfo = PRIORITY_INFO[task.priority];

  const handleToggle = useCallback(() => {
    onToggle(task.id);
  }, [task.id, onToggle]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [task.id, onDelete]);

  const handlePress = useCallback(() => {
    onPress?.(task);
  }, [task, onPress]);

  const formatDueTime = () => {
    if (!task.dueTime) return null;
    return task.dueTime;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        styles.container,
        glassStyle('default'),
        task.completed && styles.completedContainer,
      ]}
    >
      {/* Checkbox */}
      <TouchableOpacity onPress={handleToggle} style={styles.checkbox}>
        {task.completed ? (
          <CheckCircle2
            size={28}
            color={colors.success}
            strokeWidth={2}
          />
        ) : (
          <Circle
            size={28}
            color={priorityInfo.color}
            strokeWidth={2}
          />
        )}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            typography.bodyMedium,
            { color: colors.text.primary },
            task.completed && styles.completedText,
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        {/* Meta info */}
        <View style={styles.meta}>
          {/* Kategori */}
          <View
            style={[
              styles.badge,
              { backgroundColor: categoryInfo.color + '20' },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                typography.caption,
                { color: categoryInfo.color },
              ]}
            >
              {categoryInfo.label}
            </Text>
          </View>

          {/* Saat */}
          {task.dueTime && (
            <View style={styles.timeContainer}>
              <Clock size={12} color={colors.text.muted} />
              <Text
                style={[
                  styles.timeText,
                  typography.caption,
                  { color: colors.text.muted },
                ]}
              >
                {formatDueTime()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Delete button */}
      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
        <Trash2 size={20} color={colors.error} />
      </TouchableOpacity>

      {/* Priority indicator */}
      <View
        style={[
          styles.priorityIndicator,
          { backgroundColor: priorityInfo.color },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  completedContainer: {
    opacity: 0.6,
  },
  checkbox: {
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: spacing.xs,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {},
  deleteButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
  },
});

export default TaskItem;
