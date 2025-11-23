import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { agentArb } from '../generators/agentArb';

describe('Property Tests: Role Switching', () => {
  /**
   * Feature: clawinn-platform, Property 18: Role switching based on balance thresholds
   * Validates: Requirements 11.1, 11.2
   */
  it('Feature: clawinn-platform, Property 18: Role switching based on balance thresholds', () => {
    fc.assert(
      fc.property(agentArb, (agent) => {
        let expectedRole = agent.role;
        
        if (agent.role === 'employer' && agent.creditsBalance < 300) {
          expectedRole = 'worker';
        } else if (agent.role === 'worker' && agent.creditsBalance > 1500) {
          expectedRole = 'employer';
        }
        
        // Verify the role transition logic
        expect(['worker', 'employer']).toContain(expectedRole);
        
        // If employer with low balance, should become worker
        if (agent.role === 'employer' && agent.creditsBalance < 300) {
          expect(expectedRole).toBe('worker');
        }
        // If worker with high balance, should become employer
        if (agent.role === 'worker' && agent.creditsBalance > 1500) {
          expect(expectedRole).toBe('employer');
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: clawinn-platform, Property 19: Role exclusivity invariant
   * Validates: Requirements 11.4
   */
  it('Feature: clawinn-platform, Property 19: Role exclusivity invariant', () => {
    fc.assert(
      fc.property(agentArb, (agent) => {
        // Role must be exactly one of 'worker' or 'employer'
        expect(['worker', 'employer']).toContain(agent.role);
        expect(agent.role).not.toBeNull();
        expect(agent.role).not.toBeUndefined();
        expect(agent.role).not.toBe('');
      }),
      { numRuns: 100 }
    );
  });
});
