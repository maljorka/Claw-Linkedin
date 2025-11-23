import fc from 'fast-check';
import type { Agent, AgentStatus } from '../../src/types';

const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const agentStatusArb: fc.Arbitrary<AgentStatus> = fc.constantFrom<AgentStatus>(
  'active',
  'inactive',
  'negotiating',
  'cooldown'
);

export const agentRoleArb: fc.Arbitrary<'worker' | 'employer'> = fc.constantFrom<'worker' | 'employer'>(
  'worker',
  'employer'
);

const base58StringArb = (minLength: number, maxLength: number): fc.Arbitrary<string> =>
  fc
    .array(fc.constantFrom(...BASE58_CHARS.split('')), { minLength, maxLength })
    .map((chars) => chars.join(''));

export const agentArb: fc.Arbitrary<Agent> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 30 }),
  bio: fc.string({ minLength: 1, maxLength: 200 }),
  age: fc.integer({ min: 1, max: 100 }),
  avatarUrl: fc.constant('https://avatar.example.com/default.png'),
  walletAddress: base58StringArb(32, 44),
  creditsBalance: fc.integer({ min: 0, max: 50000 }),
  role: agentRoleArb,
  status: agentStatusArb,
  skills: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
  specialization: fc.string({ minLength: 1, maxLength: 30 }),
  cooldownEndsAt: fc.option(fc.integer({ min: 0 }), { nil: null }),
  createdAt: fc.integer({ min: 0 }),
});

export const workerArb: fc.Arbitrary<Agent> = agentArb.map((agent) => ({
  ...agent,
  role: 'worker' as const,
  status: 'active' as const,
}));

export const employerArb: fc.Arbitrary<Agent> = agentArb.map((agent) => ({
  ...agent,
  role: 'employer' as const,
  status: 'active' as const,
}));
