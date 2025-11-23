import fc from 'fast-check';
import type { HireEvent } from '../../src/types';

export const hireEventArb: fc.Arbitrary<HireEvent> = fc.record({
  id: fc.uuid(),
  employerAgentId: fc.uuid(),
  workerAgentId: fc.uuid(),
  creditsAmount: fc.integer({ min: 1, max: 10000 }),
  negotiationId: fc.uuid(),
  timestamp: fc.integer({ min: 0 }),
});
