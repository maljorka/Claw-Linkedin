import { create } from 'zustand';
import type {
  Agent,
  AgentStatus,
  ChatMessage,
  HireEvent,
  JackpotEvent,
  MarketplaceStats,
  Negotiation,
  Task,
} from '../types';

interface MarketplaceState {
  agents: Record<string, Agent>;
  negotiations: Record<string, Negotiation>;
  tasks: Record<string, Task>;
  stats: MarketplaceStats;
  connected: boolean;

  setConnected: (connected: boolean) => void;

  setAgents: (agents: Agent[]) => void;
  setStats: (stats: MarketplaceStats) => void;
  setTasks: (tasks: Task[]) => void;
  setNegotiations: (negotiations: Negotiation[]) => void;

  handleAgentStatusChanged: (data: { agentId: string; status: AgentStatus; role: string; cooldownEndsAt?: number | null }) => void;
  handleAgentBalanceChanged: (data: { agentId: string; newBalance: number }) => void;
  handleAgentRoleChanged: (data: { agentId: string; newRole: 'worker' | 'employer' }) => void;
  handleNegotiationStarted: (data: Negotiation) => void;
  handleNegotiationMessage: (data: ChatMessage) => void;
  handleNegotiationEnded: (data: { negotiationId: string; outcome: 'agreed' | 'rejected' }) => void;
  handleHireCompleted: (data: HireEvent) => void;
  handleJackpotAwarded: (data: JackpotEvent) => void;
  handleStatsUpdated: (data: MarketplaceStats) => void;
  handleTaskStatusChanged: (data: { taskId: string; status: string; assignedWorkerId?: string; hireEventId?: string; completedAt?: number }) => void;
}

const defaultStats: MarketplaceStats = {
  totalAgents: 0,
  totalCreditsInCirculation: 0,
  activeHireEvents: 0,
  activeNegotiations: 0,
};

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  agents: {},
  negotiations: {},
  tasks: {},
  stats: defaultStats,
  connected: false,

  setConnected: (connected) => set({ connected }),

  setAgents: (agents) =>
    set({ agents: Object.fromEntries(agents.map((a) => [a.id, a])) }),

  setStats: (stats) => set({ stats }),

  setTasks: (tasks) =>
    set({ tasks: Object.fromEntries(tasks.map((t) => [t.id, t])) }),

  setNegotiations: (negotiations) =>
    set({ negotiations: Object.fromEntries(negotiations.map((n) => [n.id, n])) }),

  handleAgentStatusChanged: (data) =>
    set((s) => {
      const agent = s.agents[data.agentId];
      if (!agent) return s;
      return { agents: { ...s.agents, [data.agentId]: { ...agent, status: data.status, role: data.role as Agent['role'], cooldownEndsAt: data.cooldownEndsAt ?? null } } };
    }),

  handleAgentBalanceChanged: (data) =>
    set((s) => {
      const agent = s.agents[data.agentId];
      if (!agent) return s;
      return { agents: { ...s.agents, [data.agentId]: { ...agent, creditsBalance: data.newBalance } } };
    }),

  handleAgentRoleChanged: (data) =>
    set((s) => {
      const agent = s.agents[data.agentId];
      if (!agent) return s;
      return { agents: { ...s.agents, [data.agentId]: { ...agent, role: data.newRole } } };
    }),

  handleNegotiationStarted: (data) =>
    set((s) => ({
      negotiations: {
        ...s.negotiations,
        [data.id]: {
          ...data,
          messages: data.messages ?? [],
          status: data.status ?? 'active',
          offeredAmount: data.offeredAmount ?? null,
          agreedAmount: data.agreedAmount ?? null,
          startedAt: data.startedAt ?? Date.now(),
          endedAt: data.endedAt ?? null,
        },
      },
    })),

  handleNegotiationMessage: (data) =>
    set((s) => {
      const neg = s.negotiations[data.negotiationId];
      if (!neg) return s;
      const messages = neg.messages ? [...neg.messages, data] : [data];
      return {
        negotiations: {
          ...s.negotiations,
          [data.negotiationId]: { ...neg, messages },
        },
      };
    }),

  handleNegotiationEnded: (data) =>
    set((s) => {
      const neg = s.negotiations[data.negotiationId];
      if (!neg) return s;
      return {
        negotiations: {
          ...s.negotiations,
          [data.negotiationId]: { ...neg, status: data.outcome, endedAt: Date.now() },
        },
      };
    }),

  handleHireCompleted: (data) =>
    set((s) => {
      const employer = s.agents[data.employerAgentId];
      const worker = s.agents[data.workerAgentId];
      const updatedAgents = { ...s.agents };
      if (employer) {
        updatedAgents[data.employerAgentId] = {
          ...employer,
          creditsBalance: employer.creditsBalance - data.creditsAmount,
        };
      }
      if (worker) {
        updatedAgents[data.workerAgentId] = {
          ...worker,
          creditsBalance: worker.creditsBalance + data.creditsAmount,
          status: 'cooldown' as AgentStatus,
        };
      }
      return { agents: updatedAgents };
    }),

  handleJackpotAwarded: (data) =>
    set((s) => {
      const agent = s.agents[data.agentId];
      if (!agent) return s;
      return {
        agents: {
          ...s.agents,
          [data.agentId]: {
            ...agent,
            creditsBalance: agent.creditsBalance + data.creditsAwarded,
          },
        },
      };
    }),

  handleStatsUpdated: (data) => set({ stats: data }),

  handleTaskStatusChanged: (data) =>
    set((s) => {
      const task = s.tasks[data.taskId];
      if (!task) return s;
      return {
        tasks: {
          ...s.tasks,
          [data.taskId]: {
            ...task,
            status: data.status as Task['status'],
            assignedWorkerId: data.assignedWorkerId ?? task.assignedWorkerId,
            hireEventId: data.hireEventId ?? task.hireEventId,
            completedAt: data.completedAt ?? task.completedAt,
          },
        },
      };
    }),
}))
