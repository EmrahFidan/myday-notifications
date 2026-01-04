// Task Types - MYday
import { Timestamp } from 'firebase/firestore';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskCategory =
  | 'work'      // İş
  | 'personal'  // Kişisel
  | 'shopping'  // Alışveriş
  | 'health'    // Sağlık
  | 'finance'   // Finans
  | 'other';    // Diğer

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: Date;
  dueTime?: string; // HH:mm format
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  order: number; // Sıralama için
}

// Firestore'dan gelen ham veri
export interface TaskFirestore {
  id: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: Timestamp;
  dueTime?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  order: number;
}

// Yeni task oluşturmak için
export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: Date;
  dueTime?: string;
}

// Task güncelleme için
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: Date;
  dueTime?: string;
  order?: number;
}

// Kategori bilgileri
export const CATEGORY_INFO: Record<TaskCategory, { label: string; icon: string; color: string }> = {
  work: { label: 'İş', icon: 'briefcase', color: '#3B82F6' },
  personal: { label: 'Kişisel', icon: 'user', color: '#8B5CF6' },
  shopping: { label: 'Alışveriş', icon: 'shopping-cart', color: '#F59E0B' },
  health: { label: 'Sağlık', icon: 'heart', color: '#EF4444' },
  finance: { label: 'Finans', icon: 'dollar-sign', color: '#22C55E' },
  other: { label: 'Diğer', icon: 'folder', color: '#6B7280' },
};

// Öncelik bilgileri
export const PRIORITY_INFO: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Düşük', color: '#22C55E' },
  medium: { label: 'Orta', color: '#F59E0B' },
  high: { label: 'Yüksek', color: '#EF4444' },
};
