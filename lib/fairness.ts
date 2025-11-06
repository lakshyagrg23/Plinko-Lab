/**
 * Provably Fair Gaming - Core Fairness Library
 * 
 * This module implements the commit-reveal protocol and deterministic PRNG
 * required for provably fair Plinko outcomes.
 * 
 * Protocol:
 * 1. Server generates serverSeed and nonce
 * 2. Server publishes commitHex = SHA256(serverSeed:nonce)
 * 3. Client provides clientSeed
 * 4. Combined seed = SHA256(serverSeed:clientSeed:nonce)
 * 5. All randomness derived from xorshift32 PRNG seeded from combinedSeed
 */

import crypto from 'crypto';

/**
 * Generate SHA-256 hash of input string
 */
export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate the commit hash from serverSeed and nonce
 * Formula: SHA256(serverSeed + ":" + nonce)
 */
export function generateCommitHex(serverSeed: string, nonce: string): string {
  return sha256(`${serverSeed}:${nonce}`);
}

/**
 * Generate the combined seed from all three inputs
 * Formula: SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
 */
export function generateCombinedSeed(
  serverSeed: string,
  clientSeed: string,
  nonce: string
): string {
  return sha256(`${serverSeed}:${clientSeed}:${nonce}`);
}

/**
 * Xorshift32 PRNG implementation
 * Seeded from first 4 bytes of hex seed (big-endian)
 * 
 * This is a simple, fast, and deterministic PRNG that produces
 * consistent sequences for the same seed.
 */
export class Xorshift32 {
  private state: number;

  constructor(seed: string) {
    // Take first 8 hex characters (4 bytes) and convert to uint32 big-endian
    const seedHex = seed.substring(0, 8);
    this.state = parseInt(seedHex, 16);
    
    // Ensure state is never 0 (xorshift32 requirement)
    if (this.state === 0) {
      this.state = 1;
    }
  }

  /**
   * Generate next pseudo-random number in range [0, 1)
   */
  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0; // Convert to unsigned 32-bit integer
    return this.state / 0x100000000; // Convert to [0, 1)
  }

  /**
   * Generate multiple random numbers at once
   */
  nextN(count: number): number[] {
    const results: number[] = [];
    for (let i = 0; i < count; i++) {
      results.push(this.next());
    }
    return results;
  }
}

/**
 * Generate a cryptographically secure random hex string
 * Used for serverSeed generation
 */
export function generateSecureRandomHex(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a random nonce (typically a number as string)
 */
export function generateNonce(): string {
  return Math.floor(Math.random() * 1000000).toString();
}

/**
 * Verify that a commit matches the revealed serverSeed and nonce
 */
export function verifyCommit(
  commitHex: string,
  serverSeed: string,
  nonce: string
): boolean {
  return commitHex === generateCommitHex(serverSeed, nonce);
}

/**
 * Complete verification of a round
 * Returns all recomputed values and verification status
 */
export interface VerificationResult {
  valid: boolean;
  commitHex: string;
  combinedSeed: string;
  commitMatches: boolean;
}

export function verifyRound(
  storedCommitHex: string,
  serverSeed: string,
  clientSeed: string,
  nonce: string
): VerificationResult {
  const recomputedCommitHex = generateCommitHex(serverSeed, nonce);
  const combinedSeed = generateCombinedSeed(serverSeed, clientSeed, nonce);
  const commitMatches = recomputedCommitHex === storedCommitHex;

  return {
    valid: commitMatches,
    commitHex: recomputedCommitHex,
    combinedSeed,
    commitMatches,
  };
}
