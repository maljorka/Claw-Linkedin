import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateWalletAddress, generateUniqueWalletAddresses, isValidSolanaAddress } from '../../server/services/walletService';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

describe('Property Tests: Wallet Address', () => {
  /**
   * Feature: clawinn-platform, Property 7: Wallet address format validity
   *
   * For any generated wallet address, it should be a valid base58 encoded string
   * with a character length between 32 and 44 characters inclusive, containing only
   * characters from the base58 alphabet (no 0, O, I, l).
   *
   * **Validates: Requirements 7.2, 13.1**
   */
  it('Feature: clawinn-platform, Property 7: Wallet address format validity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // seed for generation
        () => {
          const address = generateWalletAddress();

          // Valid base58 encoded string
          expect(typeof address).toBe('string');

          // Length between 32 and 44 characters
          expect(address.length).toBeGreaterThanOrEqual(32);
          expect(address.length).toBeLessThanOrEqual(44);

          // Contains only base58 alphabet characters (no 0, O, I, l)
          for (const char of address) {
            expect(BASE58_ALPHABET).toContain(char);
          }

          // isValidSolanaAddress should return true
          expect(isValidSolanaAddress(address)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: clawinn-platform, Property 8: Agent generation produces unique profiles
   *
   * For any invocation of the agent generation function producing 115 agents,
   * all wallet addresses should be distinct, all agent IDs should be distinct,
   * and each agent should have a non-empty name, bio, and at least one skill.
   *
   * Since the seed script isn't created yet, test the wallet uniqueness part
   * using generateUniqueWalletAddresses(115) from walletService.
   *
   * **Validates: Requirements 7.3, 13.2**
   */
  it('Feature: clawinn-platform, Property 8: Agent generation produces unique profiles', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        () => {
          const addresses = generateUniqueWalletAddresses(115);

          // All 115 wallet addresses should be distinct
          const uniqueAddresses = new Set(addresses);
          expect(uniqueAddresses.size).toBe(115);

          // Each address should be valid
          for (const addr of addresses) {
            expect(isValidSolanaAddress(addr)).toBe(true);
          }
        }
      ),
      { numRuns: 10 } // fewer runs since generating 115 addresses is expensive
    );
  });
});
