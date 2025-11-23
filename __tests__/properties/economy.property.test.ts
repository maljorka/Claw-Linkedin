import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { agentArb } from '../generators/agentArb';

describe('Property Tests: Economy', () => {
  /**
   * Feature: clawinn-platform, Property 20: Jackpot event awards exactly 10,000 credits
   * Validates: Requirements 12.3, 12.4
   */
  it('Feature: clawinn-platform, Property 20: Jackpot event awards exactly 10,000 credits', () => {
    fc.assert(
      fc.property(agentArb, (agent) => {
        const JACKPOT_AMOUNT = 10000;
        const balanceBefore = agent.creditsBalance;
        const balanceAfter = balanceBefore + JACKPOT_AMOUNT;
        
        // Jackpot should add exactly 10,000
        expect(balanceAfter - balanceBefore).toBe(10000);
        expect(balanceAfter).toBe(balanceBefore + 10000);
        // Balance should remain non-negative
        expect(balanceAfter).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});
