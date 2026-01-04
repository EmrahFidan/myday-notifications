// Add Task Modal - Basit görev ekleme
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { toast } from 'sonner-native';
import { useTheme } from '../src/theme';
import { spacing, borderRadius } from '../src/theme';
import { useTasks, TaskCategory, CATEGORY_INFO } from '../src/features/tasks';
import { Button, Input } from '../src/components/ui';

export default function AddTaskModal() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const { addTask } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Görev başlığı gerekli');
      return;
    }

    setIsLoading(true);
    try {
      await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority: 'medium', // Varsayılan, sonra sürükle-bırak ile değişir
      });
      toast.success('Görev eklendi!');
      router.back();
    } catch (error) {
      toast.error('Görev eklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [title, description, category, addTask, router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const CategoryButton = ({
    cat,
    selected,
    onPress,
  }: {
    cat: TaskCategory;
    selected: boolean;
    onPress: () => void;
  }) => {
    const info = CATEGORY_INFO[cat];
    return (
      <TouchableOpacity
        style={[
          styles.categoryButton,
          { borderColor: selected ? info.color : colors.border },
          selected && { backgroundColor: info.color + '20' },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.categoryText,
            typography.bodySmall,
            { color: selected ? info.color : colors.text.secondary },
          ]}
        >
          {info.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, typography.h3, { color: colors.text.primary }]}>
              Yeni Görev
            </Text>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              disabled={isLoading || !title.trim()}
            >
              <Check size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
          {/* Title Input */}
          <Input
            label="Görev Başlığı"
            placeholder="Ne yapacaksın?"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          {/* Description Input */}
          <Input
            label="Açıklama (Opsiyonel)"
            placeholder="Detaylar..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={styles.descriptionInput}
          />

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, typography.label, { color: colors.text.secondary }]}>
              Kategori
            </Text>
            <View style={styles.categoryGrid}>
              {(Object.keys(CATEGORY_INFO) as TaskCategory[]).map((cat) => (
                <CategoryButton
                  key={cat}
                  cat={cat}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                />
              ))}
            </View>
          </View>

          {/* Öncelik bilgisi */}
          <View style={[styles.infoBox, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[typography.bodySmall, { color: colors.text.secondary }]}>
              💡 Öncelik sıralaması görev listesinde sürükle-bırak ile ayarlanır
            </Text>
          </View>

          {/* Submit Button */}
          <Button
            title="Görev Ekle"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!title.trim()}
            fullWidth
            style={styles.submitButton}
          />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  headerTitle: {},
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['5xl'],
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  categoryText: {
    fontWeight: '500',
  },
  infoBox: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});
