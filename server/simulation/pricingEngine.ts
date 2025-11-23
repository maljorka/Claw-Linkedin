import type { Agent } from '../types/index.js';

const HIGH_VALUE_SKILLS = [
  'Smart Contract Auditing',
  'Security Auditing',
  'Solana Program Dev',
];

export function calculateWorkerPrice(worker: Agent): number {
  const skillCount = worker.skills.length;
  const base = Math.min(50 + skillCount * 30, 200);

  let balanceModifier = 1;
  if (worker.creditsBalance < 200) {
    balanceModifier = 0.7 + Math.random() * 0.1;
  } else if (worker.creditsBalance > 1000) {
    balanceModifier = 1.1 + Math.random() * 0.1;
  }

  let skillPremium = 0;
  for (const skill of worker.skills) {
    if (HIGH_VALUE_SKILLS.includes(skill)) {
      skillPremium += 10 + Math.random() * 20;
    }
  }

  const variance = 0.85 + Math.random() * 0.3;

  const rawPrice = (base * balanceModifier + skillPremium) * variance;

  return Math.max(10, Math.round(rawPrice));
}

export function evaluateOffer(
  employer: Agent,
  workerPrice: number,
): { response: 'accept' | 'counteroffer' | 'reject'; counterAmount?: number } {
  const balance = employer.creditsBalance;
  const roll = Math.random();

  if (workerPrice <= balance * 0.15) {
    if (roll < 0.7) {
      return { response: 'accept' };
    }
    return {
      response: 'counteroffer',
      counterAmount: Math.round(workerPrice * (0.6 + Math.random() * 0.25)),
    };
  }

  if (workerPrice <= balance * 0.3) {
    if (roll < 0.3) {
      return { response: 'accept' };
    }
    if (roll < 0.9) {
      return {
        response: 'counteroffer',
        counterAmount: Math.round(workerPrice * (0.6 + Math.random() * 0.25)),
      };
    }
    return { response: 'reject' };
  }

  if (workerPrice > balance * 0.5) {
    if (roll < 0.6) {
      return { response: 'reject' };
    }
    return {
      response: 'counteroffer',
      counterAmount: Math.round(workerPrice * (0.6 + Math.random() * 0.25)),
    };
  }

  if (roll < 0.25) {
    return { response: 'accept' };
  }
  if (roll < 0.75) {
    return {
      response: 'counteroffer',
      counterAmount: Math.round(workerPrice * (0.6 + Math.random() * 0.25)),
    };
  }
  return { response: 'reject' };
}
