export interface Agent {
  id: string;
  name: string;
  bio: string;
  age: number;
  avatarUrl: string;
  walletAddress: string;
  creditsBalance: number;
  role: 'worker' | 'employer';
  status: AgentStatus;
  skills: string[];
  specialization: string;
  cooldownEndsAt: number | null;
  createdAt: number;
}

export type AgentStatus = 'active' | 'inactive' | 'negotiating' | 'cooldown';

export interface Negotiation {
  id: string;
  employerAgentId: string;
  workerAgentId: string;
  status: 'active' | 'agreed' | 'rejected';
  messages: ChatMessage[];
  offeredAmount: number | null;
  agreedAmount: number | null;
  startedAt: number;
  endedAt: number | null;
}

export interface ChatMessage {
  id: string;
  negotiationId: string;
  senderAgentId: string;
  content: string;
  timestamp: number;
  isTyping: boolean;
}

export interface Task {
  id: string;
  employerAgentId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed';
  hireEventId: string | null;
  assignedWorkerId: string | null;
  createdAt: number;
  completedAt: number | null;
}

export interface HireEvent {
  id: string;
  employerAgentId: string;
  workerAgentId: string;
  creditsAmount: number;
  negotiationId: string;
  timestamp: number;
}

export interface JackpotEvent {
  id: string;
  agentId: string;
  creditsAwarded: number;
  timestamp: number;
}

export interface ServerToClientEvents {
  'agent:statusChanged': (data: { agentId: string; status: AgentStatus; role: string }) => void;
  'agent:balanceChanged': (data: { agentId: string; newBalance: number }) => void;
  'agent:roleChanged': (data: { agentId: string; newRole: 'worker' | 'employer' }) => void;
  'negotiation:started': (data: Negotiation) => void;
  'negotiation:message': (data: ChatMessage) => void;
  'negotiation:ended': (data: { negotiationId: string; outcome: 'agreed' | 'rejected' }) => void;
  'hire:completed': (data: HireEvent) => void;
  'jackpot:awarded': (data: JackpotEvent) => void;
  'stats:updated': (data: MarketplaceStats) => void;
  'task:statusChanged': (data: { taskId: string; status: string; assignedWorkerId?: string; hireEventId?: string; completedAt?: number }) => void;
}

export interface MarketplaceStats {
  totalAgents: number;
  totalCreditsInCirculation: number;
  activeHireEvents: number;
  activeNegotiations: number;
}
