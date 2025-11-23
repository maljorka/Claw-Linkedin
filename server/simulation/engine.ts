import { triggerJobNeed } from './jobTrigger.js';
import {
  initiateNegotiation,
  advanceNegotiation,
  getActiveNegotiations,
} from './negotiationManager.js';
import { processHire } from './hireProcessor.js';
import { processCooldowns as runCooldowns } from './cooldownManager.js';
import { checkAndSwitchRoles } from './roleSwitcher.js';
import { evaluateJackpots, shouldCheckJackpots } from './jackpotEvaluator.js';
import * as agentService from '../services/agentService.js';
import {
  broadcastNegotiationStarted,
  broadcastNegotiationMessage,
  broadcastNegotiationEnded,
  broadcastHireCompleted,
  broadcastAgentStatusChanged,
  broadcastAgentBalanceChanged,
  broadcastAgentRoleChanged,
  broadcastJackpotAwarded,
  broadcastStatsUpdated,
  broadcastTaskStatusChanged,
} from '../socket/handler.js';

export class SimulationEngine {
  private tickInterval: number;
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastJackpotCheckAt = 0;
  public onBroadcast: ((event: string, data: unknown) => void) | null = null;

  constructor(tickInterval = 2000) {
    this.tickInterval = tickInterval;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timer = setInterval(() => this.tick(), this.tickInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  getIsRunning(): boolean {
    return this.isRunning;
  }

  private async tick(): Promise<void> {
    try {
      await this.processJobTriggers();
      await this.advanceNegotiations();
      await this.processCooldowns();
      await this.checkRoleTransitions();
      await this.checkJackpots();

      const stats = await agentService.getStats();
      broadcastStatsUpdated(stats);
    } catch (error) {
    }
  }


  private async processJobTriggers(): Promise<void> {
    for (let i = 0; i < 1; i++) {
      const pair = await triggerJobNeed();
      if (!pair) continue;

      const negotiationId = await initiateNegotiation(pair.employer, pair.worker);
      if (negotiationId) {
        broadcastNegotiationStarted({
          id: negotiationId,
          employerAgentId: pair.employer.id,
          workerAgentId: pair.worker.id,
        });
        broadcastAgentStatusChanged(pair.employer.id, 'negotiating', pair.employer.role);
        broadcastAgentStatusChanged(pair.worker.id, 'negotiating', pair.worker.role);
      }
    }
  }

  private async advanceNegotiations(): Promise<void> {
    const negotiations = getActiveNegotiations();

    for (const neg of negotiations) {
      const lastMessageCount = neg.messages.length;
      const outcome = await advanceNegotiation(neg.id);

      if (neg.messages.length > lastMessageCount) {
        const newMessages = neg.messages.slice(lastMessageCount);
        for (const msg of newMessages) {
          broadcastNegotiationMessage({
            negotiationId: neg.id,
            senderAgentId: msg.senderId,
            content: msg.content,
            timestamp: msg.timestamp,
          });
        }
      }

      if (outcome === 'agreed') {
        broadcastNegotiationEnded(neg.id, 'agreed');

        const agreedAmount = neg.offeredAmount ?? neg.workerPrice;
        const hireEvent = await processHire(
          neg.id,
          neg.employerAgentId,
          neg.workerAgentId,
          agreedAmount,
        );

        if (hireEvent) {
          broadcastHireCompleted(hireEvent);

          if (hireEvent.taskId) {
            broadcastTaskStatusChanged({
              taskId: hireEvent.taskId,
              status: 'in_progress',
              assignedWorkerId: neg.workerAgentId,
              hireEventId: hireEvent.id,
            });
          }

          const [employer, worker] = await Promise.all([
            agentService.getById(neg.employerAgentId),
            agentService.getById(neg.workerAgentId),
          ]);
          if (employer) {
            broadcastAgentBalanceChanged(employer.id, employer.creditsBalance);
            broadcastAgentStatusChanged(employer.id, employer.status, employer.role);
          }
          if (worker) {
            broadcastAgentBalanceChanged(worker.id, worker.creditsBalance);
            broadcastAgentStatusChanged(worker.id, worker.status, worker.role, worker.cooldownEndsAt);
          }
        } else {
          const [employer, worker] = await Promise.all([
            agentService.getById(neg.employerAgentId),
            agentService.getById(neg.workerAgentId),
          ]);
          if (employer) broadcastAgentStatusChanged(employer.id, 'active', employer.role);
          if (worker) broadcastAgentStatusChanged(worker.id, 'active', worker.role);
        }
      } else if (outcome === 'rejected') {
        broadcastNegotiationEnded(neg.id, 'rejected');

        const [employer, worker] = await Promise.all([
          agentService.getById(neg.employerAgentId),
          agentService.getById(neg.workerAgentId),
        ]);
        if (employer) broadcastAgentStatusChanged(employer.id, 'active', employer.role);
        if (worker) broadcastAgentStatusChanged(worker.id, 'active', worker.role);
      }
    }
  }

  private async processCooldowns(): Promise<void> {
    const restoredIds = await runCooldowns();

    for (const agentId of restoredIds) {
      const agent = await agentService.getById(agentId);
      if (agent) {
        broadcastAgentStatusChanged(agentId, 'active', agent.role, null);

        for (const task of agent.workerTasks) {
          if (task.status === 'completed' && task.completedAt) {
            broadcastTaskStatusChanged({
              taskId: task.id,
              status: 'completed',
              assignedWorkerId: agentId,
              completedAt: task.completedAt,
            });
          }
        }
      }
    }
  }

  private async checkRoleTransitions(): Promise<void> {
    const changes = await checkAndSwitchRoles();

    for (const change of changes) {
      broadcastAgentRoleChanged(change.agentId, change.newRole);
    }
  }

  private async checkJackpots(): Promise<void> {
    if (!shouldCheckJackpots(this.lastJackpotCheckAt)) return;

    this.lastJackpotCheckAt = Date.now();
    const events = await evaluateJackpots();

    for (const event of events) {
      broadcastJackpotAwarded(event);

      const agent = await agentService.getById(event.agentId);
      if (agent) {
        broadcastAgentBalanceChanged(agent.id, agent.creditsBalance);
      }
    }
  }
}

export const engine = new SimulationEngine();
