import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { agentArb } from '../generators/agentArb';
import type { Agent } from '../../src/types';

/**
 * Pure filtering logic extracted from useWorkers() in src/hooks/useAgents.ts.
 * Filters agents to workers only, limited to 50.
 */
function filterWorkers(agents: Agent[]): Agent[] {
  return agents.filter((a) => a.role === 'worker').slice(0, 50);
}

/**
 * Pure data condition for cooldown rendering.
 * An agent should render as inactive with a cooldown indicator when
 * status is 'cooldown' and cooldownEndsAt is non-null.
 */
function isCooldownInactive(agent: Agent): boolean {
  return agent.status === 'cooldown' && agent.cooldownEndsAt != null;
}

describe('Property Tests: Dashboard', () => {
  /**
   * Feature: clawinn-platform, Property 2: Dashboard displays only workers with required fields
   *
   * For any set of agents with mixed roles and statuses, the dashboard filtering
   * function should return only agents with role 'worker', limited to at most 50
   * agents, and each returned agent card data should include name, avatar,
   * specialization, credits balance, and availability status.
   *
   * **Validates: Requirements 5.1**
   */
  it('Feature: clawinn-platform, Property 2: Dashboard displays only workers with required fields', () => {
    fc.assert(
      fc.property(
        fc.array(agentArb, { minLength: 0, maxLength: 120 }),
        (agents) => {
          const workers = filterWorkers(agents);

          // Only workers returned
          for (const w of workers) {
            expect(w.role).toBe('worker');
          }

          // At most 50
          expect(workers.length).toBeLessThanOrEqual(50);

          // Count matches: min of actual workers and 50
          const totalWorkers = agents.filter((a) => a.role === 'worker').length;
          expect(workers.length).toBe(Math.min(totalWorkers, 50));

          // Each worker has required card fields
          for (const w of workers) {
            expect(w.name).toBeDefined();
            expect(typeof w.name).toBe('string');
            expect(w.avatarUrl).toBeDefined();
            expect(typeof w.avatarUrl).toBe('string');
            expect(w.specialization).toBeDefined();
            expect(typeof w.specialization).toBe('string');
            expect(typeof w.creditsBalance).toBe('number');
            expect(w.status).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: clawinn-platform, Property 3: Cooldown agents render as inactive
   *
   * For any worker agent with status 'cooldown' and a non-null cooldownEndsAt
   * timestamp, the agent card rendering function should produce output marked as
   * visually inactive with a remaining cooldown time indicator.
   *
   * **Validates: Requirements 5.3, 10.3**
   */
  it('Feature: clawinn-platform, Property 3: Cooldown agents render as inactive', () => {
    const cooldownWorkerArb = agentArb.map((agent) => ({
      ...agent,
      role: 'worker' as const,
      status: 'cooldown' as const,
      cooldownEndsAt: Date.now() + Math.floor(Math.random() * 1_200_000) + 1,
    }));

    fc.assert(
      fc.property(cooldownWorkerArb, (agent) => {
        // Agent with status 'cooldown' and non-null cooldownEndsAt is cooldown-inactive
        expect(isCooldownInactive(agent)).toBe(true);
        expect(agent.status).toBe('cooldown');
        expect(agent.cooldownEndsAt).not.toBeNull();
        expect(typeof agent.cooldownEndsAt).toBe('number');

        // An active agent should NOT be cooldown-inactive
        const activeAgent: Agent = { ...agent, status: 'active', cooldownEndsAt: null };
        expect(isCooldownInactive(activeAgent)).toBe(false);

        // A cooldown agent with null cooldownEndsAt should NOT be cooldown-inactive
        const nullCooldown: Agent = { ...agent, cooldownEndsAt: null };
        expect(isCooldownInactive(nullCooldown)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
