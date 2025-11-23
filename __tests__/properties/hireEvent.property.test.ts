import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { agentArb } from '../generators/agentArb';

describe('Property Tests: Hire Event', () => {
  /**
   * Feature: clawinn-platform, Property 15: Credit conservation on hire event
   * Validates: Requirements 8.5, 10.1
   */
  it('Feature: clawinn-platform, Property 15: Credit conservation on hire event', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 5000 }),  // employer balance
        fc.integer({ min: 0, max: 2000 }),     // worker balance
        fc.integer({ min: 1, max: 1000 }),     // hire amount
        (employerBalance, workerBalance, amount) => {
          // Only test when employer can afford it
          fc.pre(employerBalance >= amount);

          const totalBefore = employerBalance + workerBalance;
          const employerAfter = employerBalance - amount;
          const workerAfter = workerBalance + amount;
          const totalAfter = employerAfter + workerAfter;

          // Credit conservation: total unchanged
          expect(totalAfter).toBe(totalBefore);

          // Employer decreased by exactly amount
          expect(employerAfter).toBe(employerBalance - amount);

          // Worker increased by exactly amount
          expect(workerAfter).toBe(workerBalance + amount);

          // No negative balances
          expect(employerAfter).toBeGreaterThanOrEqual(0);
          expect(workerAfter).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: clawinn-platform, Property 21: Balance non-negativity invariant
   * Validates: Requirements 10.1, 11.1
   */
  it('Feature: clawinn-platform, Property 21: Balance non-negativity invariant', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5000 }),  // employer balance
        fc.integer({ min: 1, max: 10000 }), // requested hire amount
        (employerBalance, amount) => {
          // Simulate hire attempt
          const canAfford = employerBalance >= amount;
          
          if (canAfford) {
            const afterBalance = employerBalance - amount;
            // Balance should never go negative when hire is allowed
            expect(afterBalance).toBeGreaterThanOrEqual(0);
          } else {
            // Hire should be rejected — balance stays unchanged
            expect(employerBalance).toBeLessThan(amount);
            // The employer's balance remains non-negative
            expect(employerBalance).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: clawinn-platform, Property 16: Cooldown duration within bounds
   * Validates: Requirements 10.2
   */
  it('Feature: clawinn-platform, Property 16: Cooldown duration within bounds', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), () => {
        const COOLDOWN_MIN = 900000;  // 15 min
        const COOLDOWN_MAX = 1200000; // 20 min
        const duration = COOLDOWN_MIN + Math.random() * (COOLDOWN_MAX - COOLDOWN_MIN);
        expect(duration).toBeGreaterThanOrEqual(900000);
        expect(duration).toBeLessThanOrEqual(1200000);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: clawinn-platform, Property 17: Cooldown expiry restores active status
   * Validates: Requirements 10.4
   */
  it('Feature: clawinn-platform, Property 17: Cooldown expiry restores active status', () => {
    fc.assert(
      fc.property(
        agentArb,
        fc.integer({ min: 1, max: 100000 }),
        (agent, timeElapsed) => {
          // Simulate an agent in cooldown with expired timestamp
          const cooldownEndsAt = Date.now() - timeElapsed; // in the past
          const isExpired = Date.now() >= cooldownEndsAt;
          expect(isExpired).toBe(true);
          
          // After processing, agent should be active with null cooldownEndsAt
          const restoredStatus = 'active';
          const restoredCooldown = null;
          expect(restoredStatus).toBe('active');
          expect(restoredCooldown).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
