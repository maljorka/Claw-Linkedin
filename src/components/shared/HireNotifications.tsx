import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../store/notificationStore';

export default function HireNotifications() {
  const { notifications, removeNotification, enabled } = useNotificationStore();

  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map((n) =>
      setTimeout(() => removeNotification(n.id), 2000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications, removeNotification]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-20 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 shadow-lg max-w-xs"
          >
            <p className="text-xs text-[var(--color-text)]">
              <span className="text-[var(--color-primary)] font-semibold">{n.workerName}</span>
              {' was hired by '}
              <span className="font-semibold">{n.employerName}</span>
              {' for '}
              <span className="text-[var(--color-primary)] font-semibold">{n.amount.toLocaleString()}</span>
              {' credits'}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
