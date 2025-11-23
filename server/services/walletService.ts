import { Keypair } from '@solana/web3.js';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58_REGEX = new RegExp(`^[${BASE58_ALPHABET}]+$`);
const MAX_RETRIES = 10;

export function generateWalletAddress(): string {
  const keypair = Keypair.generate();
  return keypair.publicKey.toBase58();
}

export function generateUniqueWalletAddresses(count: number): string[] {
  const addresses = new Set<string>();

  for (let i = 0; i < count; i++) {
    let retries = 0;
    let address: string;

    do {
      if (retries >= MAX_RETRIES) {
        throw new Error(
          `Failed to generate unique wallet address after ${MAX_RETRIES} retries (generated ${addresses.size}/${count})`
        );
      }
      address = generateWalletAddress();
      retries++;
    } while (addresses.has(address));

    addresses.add(address);
  }

  return Array.from(addresses);
}

export function isValidSolanaAddress(address: string): boolean {
  if (address.length < 32 || address.length > 44) {
    return false;
  }
  return BASE58_REGEX.test(address);
}
