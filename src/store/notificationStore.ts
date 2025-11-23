import { create } from 'zustand';

export interface HireNotification {
  id: string;
  workerName: string;
  employerName: string;
  amount: number;
  timestamp: number;
}

interface NotificationState {
  enabled: boolean;
  toggle: () => void;
  notifications: HireNotification[];
  addNotification: (n: HireNotification) => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  enabled: true,
  toggle: () => set((s) => ({ enabled: !s.enabled })),
  notifications: [],
  addNotification: (n) =>
    set((s) => {
      const updated = [...s.notifications, n];
      if (updated.length > 3) updated.shift();
      return { notifications: updated };
    }),
  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
}));
