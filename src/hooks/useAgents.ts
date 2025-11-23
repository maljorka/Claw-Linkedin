import { useMemo } from 'react';
import { useMarketplaceStore } from '../store/marketplaceStore';

function sortAgents(agents: import('../types').Agent[]): import('../types').Agent[] {
  return [...agents].sort((a, b) => {
    if (a.status === 'cooldown' && b.status !== 'cooldown') return 1;
    if (a.status !== 'cooldown' && b.status === 'cooldown') return -1;
    return 0;
  });
}

export function useWorkers() {
  const agents = useMarketplaceStore((s) => s.agents);
  return useMemo(
    () => sortAgents(Object.values(agents).filter((a) => a.role === 'worker').slice(0, 50)),
    [agents],
  );
}

export function useEmployers() {
  const agents = useMarketplaceStore((s) => s.agents);
  return useMemo(
    () => sortAgents(Object.values(agents).filter((a) => a.role === 'employer').slice(0, 65)),
    [agents],
  );
}

export function useAgent(id: string) {
  return useMarketplaceStore((s) => s.agents[id]);
}

export function useStats() {
  return useMarketplaceStore((s) => s.stats);
}

export function useNegotiations() {
  return useMarketplaceStore((s) => s.negotiations);
}

export function useAgentNegotiations(agentId: string) {
  const negotiations = useMarketplaceStore((s) => s.negotiations);
  return useMemo(
    () =>
      Object.values(negotiations).filter(
        (n) => n.employerAgentId === agentId || n.workerAgentId === agentId,
      ),
    [negotiations, agentId],
  );
}
