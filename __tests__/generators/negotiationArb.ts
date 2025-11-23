import fc from 'fast-check';
import type { Negotiation, ChatMessage } from '../../src/types';

export const chatMessageArb: fc.Arbitrary<ChatMessage> = fc.record({
  id: fc.uuid(),
  negotiationId: fc.uuid(),
  senderAgentId: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 300 }),
  timestamp: fc.integer({ min: 0 }),
  isTyping: fc.boolean(),
});

export const negotiationArb: fc.Arbitrary<Negotiation> = fc.record({
  id: fc.uuid(),
  employerAgentId: fc.uuid(),
  workerAgentId: fc.uuid(),
  status: fc.constantFrom<'active' | 'agreed' | 'rejected'>('active', 'agreed', 'rejected'),
  messages: fc.array(chatMessageArb, { minLength: 0, maxLength: 10 }),
  offeredAmount: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: null }),
  agreedAmount: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: null }),
  startedAt: fc.integer({ min: 0 }),
  endedAt: fc.option(fc.integer({ min: 0 }), { nil: null }),
});
