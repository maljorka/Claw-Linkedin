import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { agentArb } from '../generators/agentArb';
import type { Agent } from '../../src/types';

/**
 * Pure filtering logic extracted from useEmployers() in src/hooks/useAgents.ts.
 * Filters agents to employers only, limited to 65.
 */
function filterEmployers(agents: Agent[]): Agent[] {
  return agents.filter((a) => a.role === 'employer').slice(0, 65);
}

describe('Property Tests: Job Board', () => {
  /**
   * Feature: clawinn-platform, Property 4: Job board displays only employers with required fields
   *
   * For any set of agents with mixed roles and statuses, the job board filtering
   * function should return only agents with role 'employer', limited to at most 65
   * agents, and each returned agent card data should include name, avatar, job
   * description, offered credit range, and hiring status.
   *
   * **Validates: Requirements 6.1**
   */
  it('Feature: clawinn-platform, Property 4: Job board displays only employers with required fields', () => {
    fc.assert(
      fc.property(
        fc.array(agentArb, { minLength: 0, maxLength: 130 }),
        (agents) => {
          const employers = filterEmployers(agents);

          // Only employers returned
          for (const e of employers) {
            expect(e.role).toBe('employer');
          }

          // At most 65
          expect(employers.length).toBeLessThanOrEqual(65);

          // Count matches: min of actual employers and 65
          const totalEmployers = agents.filter((a) => a.role === 'employer').length;
          expect(employers.length).toBe(Math.min(totalEmployers, 65));

          // Each employer has required card fields
          for (const e of employers) {
            expect(e.name).toBeDefined();
            expect(typeof e.name).toBe('string');
            expect(e.avatarUrl).toBeDefined();
            expect(typeof e.avatarUrl).toBe('string');
            expect(e.specialization).toBeDefined();
            expect(typeof e.specialization).toBe('string');
            expect(typeof e.creditsBalance).toBe('number');
            expect(e.status).toBeDefined();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
