import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateWorkerPrice, evaluateOffer } from '../../server/simulation/pricingEngine';
import { workerArb, employerArb } from '../generators/agentArb';

describe('Property Tests: Pricing', () => {
  /**
   * Feature: clawinn-platform, Property 12: Worker pricing produces valid positive prices
   *
   * For any worker agent with arbitrary skills, credits balance (≥0), and market conditions,
   * the pricing function should return a positive number greater than zero.
   *
   * **Validates: Requirements 9.1**
   */
  it('Feature: clawinn-platform, Property 12: Worker pricing produces valid positive prices', () => {
    fc.assert(
      fc.property(workerArb, (worker) => {
        const price = calculateWorkerPrice(worker);

        // Must be a positive number
        expect(price).toBeGreaterThan(0);

        // Must be an integer (the implementation uses Math.round)
        expect(Number.isInteger(price)).toBe(true);

        // Must be at least 10 (the implementation floors at 10)
        expect(price).toBeGreaterThanOrEqual(10);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: clawinn-platform, Property 13: Employer evaluation produces valid response types
   *
   * For any employer agent evaluating a worker's price, the evaluation function should
   * return exactly one of: 'counteroffer' (with a positive amount), 'acceptance', or 'rejection'.
   *
   * **Validates: Requirements 9.2**
   */
  it('Feature: clawinn-platform, Property 13: Employer evaluation produces valid response types', () => {
    fc.assert(
      fc.property(
        employerArb,
        fc.integer({ min: 10, max: 5000 }),
        (employer, workerPrice) => {
          const result = evaluateOffer(employer, workerPrice);

          // Must return exactly one of the three valid response types
          expect(['accept', 'counteroffer', 'reject']).toContain(result.response);

          // If counteroffer, must have a positive counterAmount
          if (result.response === 'counteroffer') {
            expect(result.counterAmount).toBeDefined();
            expect(result.counterAmount!).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
