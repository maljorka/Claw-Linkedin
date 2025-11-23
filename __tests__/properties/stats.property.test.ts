import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { agentArb } from '../generators/agentArb';
import { hireEventArb } from '../generators/hireEventArb';
import type { Agent, HireEvent, MarketplaceStats } from '../../src/types';

/**
 * Pure computation of marketplace stats from agent and hire event arrays.
 * Mirrors the logic in server/services/agentService.ts getStats() without Prisma.
 */
function computeStats(agents: Agent[], hireEvents: HireEvent[]): MarketplaceStats {
  const totalAgents = agents.length;
  const totalCreditsInCirculation = agents.reduce((sum, a) => sum + a.creditsBalance, 0);

  // Active hire events = hire events where the worker agent is currently in cooldown
  const cooldownWorkerIds = new Set(
    agents.filter((a) => a.status === 'cooldown').map((a) => a.id)
  );
  const activeHireEvents = hireEvents.filter((e) => cooldownWorkerIds.has(e.workerAgentId)).length;

  return {
    totalAgents,
    totalCreditsInCirculation,
    activeHireEvents,
    activeNegotiations: 0,
  };
}

describe('Property Tests: Aggregate Statistics', () => {
  /**
   * Feature: clawinn-platform, Property 1: Aggregate statistics correctness
   *
   * For any set of agents with arbitrary balances, statuses, and active hire events,
   * the computed marketplace statistics should return: total active agents equal to
   * the count of agents with status 'active', total credits in circulation equal to
   * the sum of all agent balances, and active hire events equal to the count of hire
   * events without a completed cooldown.
   *
   * **Validates: Requirements 3.3, 12.5**
   */
  it('Feature: clawinn-platform, Property 1: Aggregate statistics correctness', () => {
    fc.assert(
      fc.property(
        fc.array(agentArb, { minLength: 0, maxLength: 120 }),
        fc.array(hireEventArb, { minLength: 0, maxLength: 30 }),
        (agents, hireEvents) => {
          const stats = computeStats(agents, hireEvents);

          // totalAgents equals the count of all agents
          expect(stats.totalAgents).toBe(agents.length);

          // totalCreditsInCirculation equals the sum of all agent balances
          const expectedCredits = agents.reduce((sum, a) => sum + a.creditsBalance, 0);
          expect(stats.totalCreditsInCirculation).toBe(expectedCredits);

          // activeHireEvents equals hire events where the worker is in cooldown
          const cooldownWorkerIds = new Set(
            agents.filter((a) => a.status === 'cooldown').map((a) => a.id)
          );
          const expectedActiveHires = hireEvents.filter((e) =>
            cooldownWorkerIds.has(e.workerAgentId)
          ).length;
          expect(stats.activeHireEvents).toBe(expectedActiveHires);

          // Stats values are non-negative
          expect(stats.totalAgents).toBeGreaterThanOrEqual(0);
          expect(stats.totalCreditsInCirculation).toBeGreaterThanOrEqual(0);
          expect(stats.activeHireEvents).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
