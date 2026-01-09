// Add Task Modal - Basit görev ekleme (sadece başlık)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { toast } from 'sonner-native';
import { useTheme } from '../src/theme';
import { spacing, borderRadius } from '../src/theme';
import { useTasks } from '../src/features/tasks';
import { Button, Input } from '../src/components/ui';

export default function AddTaskModal() {
  const router = useRouter();
  const { colors, typography } = useTheme();
  const { addTask } = useTasks();

  const [title, setTitle] = useState('');
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
        category: 'personal',
        priority: 'medium',
      });
      toast.success('Görev eklendi!');
      router.back();
    } catch (error) {
      toast.error('Görev eklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  }, [title, addTask, router]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, typography.h2, { color: colors.text.primary }]}>
                Yeni Görev
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Görev başlığı..."
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                style={styles.input}
              />

              <Button
                title="Ekle"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={!title.trim() || isLoading}
                style={styles.submitButton}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
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
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  form: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  input: {
    fontSize: 18,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
