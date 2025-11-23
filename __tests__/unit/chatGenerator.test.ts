import { describe, it, expect } from 'vitest';
import {
  generateTypingDelay,
  generateMessageDelay,
  generateWorkerOfferMessage,
  generateEmployerAcceptMessage,
  generateEmployerRejectMessage,
  generateEmployerCounterMessage,
  generateWorkerAcceptCounterMessage,
  generateWorkerRejectCounterMessage,
} from '../../server/simulation/chatGenerator.js';

describe('chatGenerator', () => {
  describe('generateTypingDelay', () => {
    it('returns a value between 1000 and 5000 ms', () => {
      for (let i = 0; i < 100; i++) {
        const delay = generateTypingDelay();
        expect(delay).toBeGreaterThanOrEqual(1000);
        expect(delay).toBeLessThanOrEqual(5000);
      }
    });
  });

  describe('generateMessageDelay', () => {
    it('returns a value between 2000 and 8000 ms', () => {
      for (let i = 0; i < 100; i++) {
        const delay = generateMessageDelay();
        expect(delay).toBeGreaterThanOrEqual(2000);
        expect(delay).toBeLessThanOrEqual(8000);
      }
    });
  });

  describe('generateWorkerOfferMessage', () => {
    it('returns a non-empty string containing the price', () => {
      const msg = generateWorkerOfferMessage('Alice', 150);
      expect(msg).toBeTruthy();
      expect(msg).toContain('150');
    });
  });

  describe('generateEmployerAcceptMessage', () => {
    it('returns a non-empty string containing the amount', () => {
      const msg = generateEmployerAcceptMessage('Bob', 200);
      expect(msg).toBeTruthy();
      expect(msg).toContain('200');
    });
  });

  describe('generateEmployerRejectMessage', () => {
    it('returns a non-empty rejection string', () => {
      const msg = generateEmployerRejectMessage('Bob');
      expect(msg).toBeTruthy();
      expect(msg.length).toBeGreaterThan(5);
    });
  });

  describe('generateEmployerCounterMessage', () => {
    it('returns a non-empty string containing the counter amount', () => {
      const msg = generateEmployerCounterMessage('Bob', 120);
      expect(msg).toBeTruthy();
      expect(msg).toContain('120');
    });
  });

  describe('generateWorkerAcceptCounterMessage', () => {
    it('returns a non-empty string containing the accepted amount', () => {
      const msg = generateWorkerAcceptCounterMessage('Alice', 130);
      expect(msg).toBeTruthy();
      expect(msg).toContain('130');
    });
  });

  describe('generateWorkerRejectCounterMessage', () => {
    it('returns a non-empty string containing the original price', () => {
      const msg = generateWorkerRejectCounterMessage('Alice', 180);
      expect(msg).toBeTruthy();
      expect(msg).toContain('180');
    });
  });
});
