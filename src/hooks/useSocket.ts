import { useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket';

async function syncState() {
  try {
    const [agentsRes, statsRes, negotiationsRes, tasksRes] = await Promise.all([
      fetch('/api/agents'),
      fetch('/api/stats'),
      fetch('/api/negotiations'),
      fetch('/api/tasks'),
    ]);
    if (!agentsRes.ok || !statsRes.ok) return;

    const agents = await agentsRes.json();
    const stats = await statsRes.json();

    const { useMarketplaceStore } = await import('../store/marketplaceStore');
    const store = useMarketplaceStore.getState();
    store.setAgents(agents);
    store.setStats(stats);

    if (negotiationsRes.ok) {
      const negotiations = await negotiationsRes.json();
      store.setNegotiations(negotiations);
    }

    if (tasksRes.ok) {
      const tasks = await tasksRes.json();
      store.setTasks(tasks);
    }

    store.setConnected(true);
  } catch {
  }
}

export function useSocket() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const socket = getSocket();

    socket.on('connect', () => {
      syncState();
    });

    socket.on('disconnect', async () => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      useMarketplaceStore.getState().setConnected(false);
    });

    socket.on('agent:statusChanged', async (data) => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      useMarketplaceStore.getState().handleAgentStatusChanged(data);
    });

    socket.on('agent:balanceChanged', async (data) => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      useMarketplaceStore.getState().handleAgentBalanceChanged(data);
    });

    socket.on('agent:roleChanged', async (data) => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      useMarketplaceStore.getState().handleAgentRoleChanged(data);
    });

    socket.on('negotiation:started', async (data) => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      useMarketplaceStore.getState().handleNegotiationStarted(data);
    });

    socket.on('negotiation:message', async (data) => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      useMarketplaceStore.getState().handleNegotiationMessage(data);
    });

    socket.on('negotiation:ended', async (data) => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      useMarketplaceStore.getState().handleNegotiationEnded(data);
    });

    socket.on('hire:completed', async (data) => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      const store = useMarketplaceStore.getState();
      store.handleHireCompleted(data);

      const { useNotificationStore } = await import('../store/notificationStore');
      const notifStore = useNotificationStore.getState();
      if (notifStore.enabled) {
        const workerName = store.agents[data.workerAgentId]?.name ?? 'Unknown';
        const employerName = store.agents[data.employerAgentId]?.name ?? 'Unknown';
        notifStore.addNotification({
          id: data.id,
          workerName,
          employerName,
          amount: data.creditsAmount,
          timestamp: Date.now(),
        });
      }
    });

    socket.on('jackpot:awarded', async (data) => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      useMarketplaceStore.getState().handleJackpotAwarded(data);
    });

    socket.on('stats:updated', async (data) => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      useMarketplaceStore.getState().handleStatsUpdated(data);
    });

    socket.on('task:statusChanged', async (data) => {
      const { useMarketplaceStore } = await import('../store/marketplaceStore');
      useMarketplaceStore.getState().handleTaskStatusChanged(data);
    });

    socket.io.on('reconnect', () => {
      syncState();
    });

    socket.connect();
  }, []);
}
