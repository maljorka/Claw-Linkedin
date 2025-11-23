import { Server } from 'socket.io';
import type { AgentStatus, HireEvent, JackpotEvent, MarketplaceStats } from '../types/index.js';

let io: Server | null = null;

export function setIO(socketIO: Server): void {
  io = socketIO;
}

export function broadcastAgentStatusChanged(agentId: string, status: AgentStatus, role: string, cooldownEndsAt?: number | null): void {
  io?.emit('agent:statusChanged', { agentId, status, role, cooldownEndsAt: cooldownEndsAt ?? null });
}

export function broadcastAgentBalanceChanged(agentId: string, newBalance: number): void {
  io?.emit('agent:balanceChanged', { agentId, newBalance });
}

export function broadcastAgentRoleChanged(agentId: string, newRole: 'worker' | 'employer'): void {
  io?.emit('agent:roleChanged', { agentId, newRole });
}

export function broadcastNegotiationStarted(negotiation: { id: string; employerAgentId: string; workerAgentId: string }): void {
  io?.emit('negotiation:started', negotiation);
}

export function broadcastNegotiationMessage(message: { negotiationId: string; senderAgentId: string; content: string; timestamp: number }): void {
  io?.emit('negotiation:message', message);
}

export function broadcastNegotiationEnded(negotiationId: string, outcome: 'agreed' | 'rejected'): void {
  io?.emit('negotiation:ended', { negotiationId, outcome });
}

export function broadcastHireCompleted(hireEvent: HireEvent): void {
  io?.emit('hire:completed', hireEvent);
}

export function broadcastJackpotAwarded(jackpotEvent: JackpotEvent): void {
  io?.emit('jackpot:awarded', jackpotEvent);
}

export function broadcastStatsUpdated(stats: MarketplaceStats): void {
  io?.emit('stats:updated', stats);
}

export function broadcastTaskStatusChanged(data: { taskId: string; status: string; assignedWorkerId?: string; hireEventId?: string; completedAt?: number }): void {
  io?.emit('task:statusChanged', data);
}
