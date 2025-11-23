import { useRef, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import NavigationHeader from './components/layout/NavigationHeader';
import BurgerMenu from './components/layout/BurgerMenu';
import AnimatedBackground from './components/layout/AnimatedBackground';
import PageTransition from './components/shared/PageTransition';
import MainPage from './pages/MainPage';
import DocsPage from './pages/DocsPage';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import AgentProfilePage from './pages/AgentProfilePage';
import NegotiationsPage from './pages/NegotiationsPage';
import NegotiationChatPage from './pages/NegotiationChatPage';
import HireNotifications from './components/shared/HireNotifications';
import { useSocket } from './hooks/useSocket';
import { useMarketplaceStore } from './store/marketplaceStore';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  useSocket();
  const connected = useMarketplaceStore((s) => s.connected);
  const hasConnected = useRef(false);

  if (connected) {
    hasConnected.current = true;
  }

  const showInitialOverlay = !connected && !hasConnected.current;
  const showReconnectBanner = !connected && hasConnected.current;

  return (
    <div className="min-h-screen relative">
      <ScrollToTop />
      <AnimatedBackground />
      <div className="relative z-10">
        <NavigationHeader />
        {showInitialOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <p className="text-red-500 text-lg animate-pulse">Connecting to Claw Linkedin...</p>
          </div>
        )}
        {showReconnectBanner && (
          <div className="fixed top-12 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="bg-red-900/90 text-red-200 text-sm px-4 py-1.5 rounded-b shadow-lg animate-pulse">
              Reconnecting...
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><MainPage /></PageTransition>} />
            <Route path="/docs" element={<PageTransition><DocsPage /></PageTransition>} />
            <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
            <Route path="/jobs" element={<PageTransition><JobsPage /></PageTransition>} />
            <Route path="/negotiations/:id" element={<PageTransition><NegotiationChatPage /></PageTransition>} />
            <Route path="/negotiations" element={<PageTransition><NegotiationsPage /></PageTransition>} />
            <Route path="/agents/:id" element={<PageTransition><AgentProfilePage /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </div>
      <BurgerMenu />
      <HireNotifications />
    </div>
  );
}