import { describe, it, expect } from 'vitest';
import { calculateWorkerPrice, evaluateOffer } from '../../server/simulation/pricingEngine.js';
import type { Agent } from '../../server/types/index.js';

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'test-agent',
    name: 'Test Agent',
    bio: 'A test agent',
    age: 25,
    avatarUrl: 'https://example.com/avatar.png',
    walletAddress: 'TestWa11etAddress1234567890abcdef',
    creditsBalance: 500,
    role: 'worker',
    status: 'active',
    skills: ['TypeScript', 'React'],
    specialization: 'Frontend Dev',
    cooldownEndsAt: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('calculateWorkerPrice', () => {
  it('returns a positive integer >= 10', () => {
    const worker = makeAgent();
    for (let i = 0; i < 100; i++) {
      const price = calculateWorkerPrice(worker);
      expect(price).toBeGreaterThanOrEqual(10);
      expect(Number.isInteger(price)).toBe(true);
    }
  });

  it('returns higher base price for more skills', () => {
    const fewSkills = makeAgent({ skills: ['A'], creditsBalance: 500 });
    const manySkills = makeAgent({ skills: ['A', 'B', 'C', 'D', 'E'], creditsBalance: 500 });

    // Run multiple times and compare averages
    let fewTotal = 0;
    let manyTotal = 0;
    const runs = 500;
    for (let i = 0; i < runs; i++) {
      fewTotal += calculateWorkerPrice(fewSkills);
      manyTotal += calculateWorkerPrice(manySkills);
    }
    expect(manyTotal / runs).toBeGreaterThan(fewTotal / runs);
  });

  it('adds skill premium for high-value skills', () => {
    const regular = makeAgent({ skills: ['TypeScript'], creditsBalance: 500 });
    const premium = makeAgent({ skills: ['Smart Contract Auditing'], creditsBalance: 500 });

    let regularTotal = 0;
    let premiumTotal = 0;
    const runs = 500;
    for (let i = 0; i < runs; i++) {
      regularTotal += calculateWorkerPrice(regular);
      premiumTotal += calculateWorkerPrice(premium);
    }
    expect(premiumTotal / runs).toBeGreaterThan(regularTotal / runs);
  });

  it('returns >= 10 even for zero-skill zero-balance agents', () => {
    const desperate = makeAgent({ skills: [], creditsBalance: 0 });
    for (let i = 0; i < 100; i++) {
      expect(calculateWorkerPrice(desperate)).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('evaluateOffer', () => {
  it('always returns a valid response type', () => {
    const employer = makeAgent({ role: 'employer', creditsBalance: 2000 });
    for (let i = 0; i < 200; i++) {
      const result = evaluateOffer(employer, 100 + Math.floor(Math.random() * 900));
      expect(['accept', 'counteroffer', 'reject']).toContain(result.response);
      if (result.response === 'counteroffer') {
        expect(result.counterAmount).toBeDefined();
        expect(result.counterAmount).toBeGreaterThan(0);
      }
    }
  });

  it('counteroffer amount is 60-85% of worker price', () => {
    const employer = makeAgent({ role: 'employer', creditsBalance: 2000 });
    for (let i = 0; i < 200; i++) {
      const workerPrice = 200;
      const result = evaluateOffer(employer, workerPrice);
      if (result.response === 'counteroffer' && result.counterAmount !== undefined) {
        expect(result.counterAmount).toBeGreaterThanOrEqual(Math.round(workerPrice * 0.6));
        expect(result.counterAmount).toBeLessThanOrEqual(Math.round(workerPrice * 0.85));
      }
    }
  });

  it('handles zero-balance employer gracefully', () => {
    const broke = makeAgent({ role: 'employer', creditsBalance: 0 });
    const result = evaluateOffer(broke, 100);
    expect(['accept', 'counteroffer', 'reject']).toContain(result.response);
  });
});
