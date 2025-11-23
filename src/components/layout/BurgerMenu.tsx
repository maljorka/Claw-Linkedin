import { useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../../store/notificationStore';

const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline mr-1">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const BellSlashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline mr-1">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.856 23.856 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.9 23.9 0 003.536-1.003A8.967 8.967 0 0118 9.75V9A6 6 0 006.53 6.53m10.245 10.245L6.53 6.53M3 3l3.53 3.53" />
  </svg>
);

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/docs', label: 'Docs' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/negotiations', label: 'Negotiations' },
];

export default function BurgerMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { enabled, toggle } = useNotificationStore();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 flex flex-col items-center justify-center gap-1.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg hover:border-primary transition-colors"
        style={{ transitionDuration: 'var(--duration-fast)' }}
        aria-label="Toggle navigation menu"
      >
        <span className={`block w-5 h-0.5 bg-primary transition-transform duration-300 ${open ? 'translate-y-2 rotate-45' : ''}`} />
        <span className={`block w-5 h-0.5 bg-primary transition-opacity duration-300 ${open ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-primary transition-transform duration-300 ${open ? '-translate-y-2 -rotate-45' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[var(--color-bg)]/95 backdrop-blur-sm flex items-center justify-center"
            onClick={close}
          >
            <motion.nav
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-12 py-10 flex flex-col items-center gap-6"
              style={{
                boxShadow: '0 0 40px rgba(220, 38, 38, 0.15), 0 0 80px rgba(220, 38, 38, 0.05)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-2">
                Navigation
              </span>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-3xl font-bold transition-colors ${
                    location.pathname === link.to
                      ? 'text-primary'
                      : 'text-[var(--color-text)] hover:text-primary'
                  }`}
                  style={{ transitionDuration: 'var(--duration-fast)' }}
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={toggle}
                className="mt-4 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                {enabled ? <><BellIcon /> Notifications On</> : <><BellSlashIcon /> Notifications Off</>}
              </button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}