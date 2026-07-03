import { create } from "zustand";

export interface Notification {
  id: string;
  type: "success" | "info" | "warning" | "error" | "ai";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  issueId?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
      read: false,
    };
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }));
  },
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  dismiss: (id) =>
    set((state) => {
      const n = state.notifications.find((x) => x.id === id);
      return {
        notifications: state.notifications.filter((x) => x.id !== id),
        unreadCount: n && !n.read ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }),
}));
