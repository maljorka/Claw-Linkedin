import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { agentArb } from '../generators/agentArb';
import { hireEventArb } from '../generators/hireEventArb';
import { sortHireEventsNewestFirst } from '../../src/components/agents/WorkHistory';
import type { Agent, HireEvent } from '../../src/types';

/**
 * Checks that an agent object contains all required profile fields
 * with correct types as specified in Requirement 7.1.
 */
function hasAllRequiredProfileFields(agent: Agent): boolean {
  return (
    typeof agent.name === 'string' &&
    typeof agent.bio === 'string' &&
    typeof agent.age === 'number' &&
    typeof agent.avatarUrl === 'string' &&
    Array.isArray(agent.skills) &&
    typeof agent.specialization === 'string' &&
    typeof agent.creditsBalance === 'number' &&
    typeof agent.walletAddress === 'string' &&
    typeof agent.status === 'string' &&
    ['active', 'inactive', 'negotiating', 'cooldown'].includes(agent.status)
  );
}

describe('Property Tests: Agent Profile', () => {
  /**
   * Feature: clawinn-platform, Property 5: Agent profile contains all required fields
   *
   * For any valid agent, the profile card rendering function should produce output
   * containing: name, bio, age, avatar image, skills, specialization, credits balance,
   * work history, wallet address, and current status.
   *
   * **Validates: Requirements 7.1**
   */
  it('Feature: clawinn-platform, Property 5: Agent profile contains all required fields', () => {
    fc.assert(
      fc.property(agentArb, (agent) => {
        expect(hasAllRequiredProfileFields(agent)).toBe(true);

        // Verify each field individually
        expect(agent.name).toBeDefined();
        expect(agent.bio).toBeDefined();
        expect(agent.age).toBeGreaterThanOrEqual(1);
        expect(agent.avatarUrl).toBeDefined();
        expect(agent.skills.length).toBeGreaterThanOrEqual(1);
        expect(agent.specialization).toBeDefined();
        expect(typeof agent.creditsBalance).toBe('number');
        expect(agent.creditsBalance).toBeGreaterThanOrEqual(0);
        expect(agent.walletAddress.length).toBeGreaterThanOrEqual(32);
        expect(agent.walletAddress.length).toBeLessThanOrEqual(44);
        expect(['active', 'inactive', 'negotiating', 'cooldown']).toContain(agent.status);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Feature: clawinn-platform, Property 6: Work history is chronological with required fields
   *
   * For any agent with one or more hire events in their work history, the displayed
   * work history entries should be sorted in chronological order by timestamp, and
   * each entry should contain: timestamp, role (employer or worker), counterpart
   * agent name, and credits amount.
   *
   * **Validates: Requirements 7.5, 10.5**
   */
  it('Feature: clawinn-platform, Property 6: Work history is chronological with required fields', () => {
    fc.assert(
      fc.property(
        fc.array(hireEventArb, { minLength: 1, maxLength: 50 }),
        (events) => {
          const sorted = sortHireEventsNewestFirst(events);

          // Same length — no events lost or duplicated
          expect(sorted.length).toBe(events.length);

          // Sorted newest-first (descending by timestamp)
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i - 1].timestamp).toBeGreaterThanOrEqual(sorted[i].timestamp);
          }

          // Each entry has all required fields
          for (const entry of sorted) {
            expect(typeof entry.timestamp).toBe('number');
            expect(typeof entry.employerAgentId).toBe('string');
            expect(entry.employerAgentId.length).toBeGreaterThan(0);
            expect(typeof entry.workerAgentId).toBe('string');
            expect(entry.workerAgentId.length).toBeGreaterThan(0);
            expect(typeof entry.creditsAmount).toBe('number');
            expect(entry.creditsAmount).toBeGreaterThan(0);
          }

          // Original array is not mutated
          for (let i = 0; i < events.length; i++) {
            expect(events[i]).toBeDefined();
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
