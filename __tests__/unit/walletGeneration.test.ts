import { describe, it, expect } from 'vitest';
import {
  generateWalletAddress,
  generateUniqueWalletAddresses,
  isValidSolanaAddress,
} from '../../server/services/walletService';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

describe('walletService', () => {
  describe('generateWalletAddress', () => {
    it('returns a base58 string between 32 and 44 characters', () => {
      const address = generateWalletAddress();
      expect(address.length).toBeGreaterThanOrEqual(32);
      expect(address.length).toBeLessThanOrEqual(44);
    });

    it('contains only base58 alphabet characters', () => {
      const address = generateWalletAddress();
      for (const char of address) {
        expect(BASE58_ALPHABET).toContain(char);
      }
    });

    it('does not contain forbidden characters (0, O, I, l)', () => {
      const address = generateWalletAddress();
      expect(address).not.toMatch(/[0OIl]/);
    });
  });

  describe('generateUniqueWalletAddresses', () => {
    it('generates the requested number of addresses', () => {
      const addresses = generateUniqueWalletAddresses(5);
      expect(addresses).toHaveLength(5);
    });

    it('generates all unique addresses', () => {
      const addresses = generateUniqueWalletAddresses(20);
      const unique = new Set(addresses);
      expect(unique.size).toBe(20);
    });

    it('generates 115 unique addresses for the full agent set', () => {
      const addresses = generateUniqueWalletAddresses(115);
      const unique = new Set(addresses);
      expect(unique.size).toBe(115);
    });

    it('all generated addresses are valid Solana addresses', () => {
      const addresses = generateUniqueWalletAddresses(10);
      for (const addr of addresses) {
        expect(isValidSolanaAddress(addr)).toBe(true);
      }
    });

    it('returns an empty array when count is 0', () => {
      const addresses = generateUniqueWalletAddresses(0);
      expect(addresses).toHaveLength(0);
    });
  });

  describe('isValidSolanaAddress', () => {
    it('returns true for a valid generated address', () => {
      const address = generateWalletAddress();
      expect(isValidSolanaAddress(address)).toBe(true);
    });

    it('returns false for a string shorter than 32 characters', () => {
      expect(isValidSolanaAddress('abc123')).toBe(false);
    });

    it('returns false for a string longer than 44 characters', () => {
      const longAddr = '1'.repeat(45);
      expect(isValidSolanaAddress(longAddr)).toBe(false);
    });

    it('returns false for strings containing 0 (zero)', () => {
      const addr = '0' + '1'.repeat(31);
      expect(isValidSolanaAddress(addr)).toBe(false);
    });

    it('returns false for strings containing O (uppercase O)', () => {
      const addr = 'O' + '1'.repeat(31);
      expect(isValidSolanaAddress(addr)).toBe(false);
    });

    it('returns false for strings containing I (uppercase I)', () => {
      const addr = 'I' + '1'.repeat(31);
      expect(isValidSolanaAddress(addr)).toBe(false);
    });

    it('returns false for strings containing l (lowercase L)', () => {
      const addr = 'l' + '1'.repeat(31);
      expect(isValidSolanaAddress(addr)).toBe(false);
    });

    it('returns true for a 32-character valid base58 string', () => {
      const addr = '1'.repeat(32);
      expect(isValidSolanaAddress(addr)).toBe(true);
    });

    it('returns true for a 44-character valid base58 string', () => {
      const addr = 'A'.repeat(44);
      expect(isValidSolanaAddress(addr)).toBe(true);
    });

    it('returns false for an empty string', () => {
      expect(isValidSolanaAddress('')).toBe(false);
    });
  });
});
