import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { agentArb, workerArb, employerArb } from './agentArb';
import { negotiationArb, chatMessageArb } from './negotiationArb';
import { hireEventArb } from './hireEventArb';

describe('Test generators smoke test', () => {
  it('agentArb generates valid agents', () => {
    fc.assert(
      fc.property(agentArb, (agent) => {
        expect(agent.id).toBeDefined();
        expect(agent.name).toBeDefined();
        expect(agent.walletAddress.length).toBeGreaterThanOrEqual(32);
        expect(agent.walletAddress.length).toBeLessThanOrEqual(44);
        expect(['worker', 'employer']).toContain(agent.role);
        expect(['active', 'inactive', 'negotiating', 'cooldown']).toContain(agent.status);
      }),
      { numRuns: 50 }
    );
  });

  it('workerArb generates workers with active status', () => {
    fc.assert(
      fc.property(workerArb, (agent) => {
        expect(agent.role).toBe('worker');
        expect(agent.status).toBe('active');
      }),
      { numRuns: 50 }
    );
  });

  it('employerArb generates employers with active status', () => {
    fc.assert(
      fc.property(employerArb, (agent) => {
        expect(agent.role).toBe('employer');
        expect(agent.status).toBe('active');
      }),
      { numRuns: 50 }
    );
  });

  it('negotiationArb generates valid negotiations', () => {
    fc.assert(
      fc.property(negotiationArb, (negotiation) => {
        expect(negotiation.id).toBeDefined();
        expect(['active', 'agreed', 'rejected']).toContain(negotiation.status);
      }),
      { numRuns: 50 }
    );
  });

  it('chatMessageArb generates valid messages', () => {
    fc.assert(
      fc.property(chatMessageArb, (msg) => {
        expect(msg.id).toBeDefined();
        expect(msg.content).toBeDefined();
        expect(typeof msg.isTyping).toBe('boolean');
      }),
      { numRuns: 50 }
    );
  });

  it('hireEventArb generates valid hire events', () => {
    fc.assert(
      fc.property(hireEventArb, (event) => {
        expect(event.id).toBeDefined();
        expect(event.creditsAmount).toBeGreaterThan(0);
      }),
      { numRuns: 50 }
    );
  });
});
