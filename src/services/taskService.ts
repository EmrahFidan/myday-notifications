// Task Service - Firestore CRUD Operations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Task,
  TaskFirestore,
  CreateTaskInput,
  UpdateTaskInput,
} from '../types/task';

// Firestore'dan Task'a dönüştür
const convertToTask = (docData: TaskFirestore): Task => ({
  ...docData,
  dueDate: docData.dueDate?.toDate(),
  createdAt: docData.createdAt.toDate(),
  updatedAt: docData.updatedAt.toDate(),
  completedAt: docData.completedAt?.toDate(),
});

class TaskService {
  private getTasksRef(userId: string) {
    return collection(db, 'users', userId, 'tasks');
  }

  // Real-time listener for tasks
  subscribeToTasks(
    userId: string,
    onUpdate: (tasks: Task[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const tasksRef = this.getTasksRef(userId);
    const q = query(tasksRef, orderBy('order', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasks: Task[] = [];
        snapshot.forEach((docItem) => {
          const data = { id: docItem.id, ...docItem.data() } as TaskFirestore;
          tasks.push(convertToTask(data));
        });
        onUpdate(tasks);
      },
      onError
    );

    return unsubscribe;
  }

  // Bugünün görevlerini getir
  subscribeToDailyTasks(
    userId: string,
    onUpdate: (tasks: Task[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const tasksRef = this.getTasksRef(userId);

    // Bugünün başlangıcı ve sonu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
      tasksRef,
      where('createdAt', '>=', Timestamp.fromDate(today)),
      where('createdAt', '<', Timestamp.fromDate(tomorrow)),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasks: Task[] = [];
        snapshot.forEach((docItem) => {
          const data = { id: docItem.id, ...docItem.data() } as TaskFirestore;
          tasks.push(convertToTask(data));
        });
        // Order'a göre sırala
        tasks.sort((a, b) => a.order - b.order);
        onUpdate(tasks);
      },
      onError
    );

    return unsubscribe;
  }

  // Yeni görev ekle (en üste)
  async addTask(userId: string, input: CreateTaskInput): Promise<string> {
    const tasksRef = this.getTasksRef(userId);

    // Tamamlanmamış görevlerin order'ını 1 artır (yeni görev en üste gelecek)
    const q = query(tasksRef, where('completed', '==', false));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const batch = writeBatch(db);
      snapshot.docs.forEach((docItem) => {
        const currentOrder = docItem.data().order || 0;
        batch.update(docItem.ref, { order: currentOrder + 1 });
      });
      await batch.commit();
    }

    const now = Timestamp.now();
    const taskData = {
      userId,
      title: input.title.trim(),
      description: input.description?.trim() || '',
      completed: false,
      priority: input.priority || 'medium',
      category: input.category || 'personal',
      dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
      dueTime: input.dueTime || null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      order: 0, // Yeni görev her zaman en üstte
    };

    const docRef = await addDoc(tasksRef, taskData);
    return docRef.id;
  }

  // Görevi güncelle
  async updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<void> {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);

    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };

    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.description !== undefined) updateData.description = input.description.trim();
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.order !== undefined) updateData.order = input.order;
    if (input.dueDate !== undefined) {
      updateData.dueDate = input.dueDate ? Timestamp.fromDate(input.dueDate) : null;
    }
    if (input.dueTime !== undefined) updateData.dueTime = input.dueTime;

    // Tamamlandı durumu değiştiyse
    if (input.completed !== undefined) {
      updateData.completed = input.completed;
      updateData.completedAt = input.completed ? Timestamp.now() : null;
    }

    await updateDoc(taskRef, updateData);
  }

  // Görevi tamamla/geri al
  async toggleTask(userId: string, taskId: string, completed: boolean): Promise<void> {
    await this.updateTask(userId, taskId, { completed });
  }

  // Görevi sil
  async deleteTask(userId: string, taskId: string): Promise<void> {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
  }

  // Tamamlanmış görevleri temizle
  async clearCompletedTasks(userId: string): Promise<void> {
    const tasksRef = this.getTasksRef(userId);
    const q = query(tasksRef, where('completed', '==', true));
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    snapshot.docs.forEach((docItem) => {
      batch.delete(docItem.ref);
    });

    await batch.commit();
  }

  // Görevlerin sırasını güncelle
  async reorderTasks(userId: string, taskOrders: { id: string; order: number }[]): Promise<void> {
    const batch = writeBatch(db);

    taskOrders.forEach(({ id, order }) => {
      const taskRef = doc(db, 'users', userId, 'tasks', id);
      batch.update(taskRef, { order, updatedAt: Timestamp.now() });
    });

    await batch.commit();
  }
}

export const taskService = new TaskService();
export default taskService;
