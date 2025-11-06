/**
 * Test Suite for Provably Fair Plinko
 * 
 * These tests verify that our implementation matches the reference test vectors
 * provided in the assignment specification.
 */

import { describe, test, expect } from '@jest/globals';
import {
  sha256,
  generateCommitHex,
  generateCombinedSeed,
  Xorshift32,
  verifyCommit,
} from '../lib/fairness';
import { computePlinkoOutcome, generatePegMap, hashPegMap } from '../lib/plinko-engine';
import { getMultiplier } from '../lib/payout';

// Test vectors from assignment
const TEST_VECTORS = {
  serverSeed: 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc',
  nonce: '42',
  clientSeed: 'candidate-hello',
  dropColumn: 6,
  expectedCommitHex: 'bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34',
  expectedCombinedSeed: 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0',
  expectedFirstFiveRands: [
    0.1106166649,
    0.7625129214,
    0.0439292176,
    0.4578678815,
    0.3438999297,
  ],
  expectedPegMapRow0: [0.422123],
  expectedPegMapRow1: [0.552503, 0.408786],
  expectedPegMapRow2: [0.491574, 0.468780, 0.436540],
  expectedBinIndex: 6,
};

describe('Fairness Protocol', () => {
  test('SHA-256 hashing works correctly', () => {
    const input = 'test';
    const hash = sha256(input);
    expect(hash).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
  });

  test('Commit hash generation matches test vector', () => {
    const commitHex = generateCommitHex(
      TEST_VECTORS.serverSeed,
      TEST_VECTORS.nonce
    );
    expect(commitHex).toBe(TEST_VECTORS.expectedCommitHex);
  });

  test('Combined seed generation matches test vector', () => {
    const combinedSeed = generateCombinedSeed(
      TEST_VECTORS.serverSeed,
      TEST_VECTORS.clientSeed,
      TEST_VECTORS.nonce
    );
    expect(combinedSeed).toBe(TEST_VECTORS.expectedCombinedSeed);
  });

  test('Commit verification works correctly', () => {
    const isValid = verifyCommit(
      TEST_VECTORS.expectedCommitHex,
      TEST_VECTORS.serverSeed,
      TEST_VECTORS.nonce
    );
    expect(isValid).toBe(true);

    // Test invalid commit
    const isInvalid = verifyCommit(
      'invalid_commit_hex',
      TEST_VECTORS.serverSeed,
      TEST_VECTORS.nonce
    );
    expect(isInvalid).toBe(false);
  });
});

describe('Xorshift32 PRNG', () => {
  test('PRNG initialization from seed', () => {
    const prng = new Xorshift32(TEST_VECTORS.expectedCombinedSeed);
    expect(prng).toBeDefined();
  });

  test('PRNG generates expected sequence matching test vectors', () => {
    const prng = new Xorshift32(TEST_VECTORS.expectedCombinedSeed);
    const firstFive = prng.nextN(5);

    // Check each value with tolerance for floating point precision
    firstFive.forEach((value, index) => {
      const expected = TEST_VECTORS.expectedFirstFiveRands[index];
      const tolerance = 0.0000001; // 7 decimal places
      expect(Math.abs(value - expected)).toBeLessThan(tolerance);
    });
  });

  test('PRNG is deterministic - same seed produces same sequence', () => {
    const prng1 = new Xorshift32(TEST_VECTORS.expectedCombinedSeed);
    const prng2 = new Xorshift32(TEST_VECTORS.expectedCombinedSeed);

    const seq1 = prng1.nextN(10);
    const seq2 = prng2.nextN(10);

    expect(seq1).toEqual(seq2);
  });
});

describe('Peg Map Generation', () => {
  test('Peg map has correct structure', () => {
    const prng = new Xorshift32(TEST_VECTORS.expectedCombinedSeed);
    const pegMap = generatePegMap(prng);

    expect(pegMap.rows).toHaveLength(12);

    // Verify each row has r+1 pegs
    pegMap.rows.forEach((row, index) => {
      expect(row).toHaveLength(index + 1);
    });
  });

  test('Peg map matches test vectors for first rows', () => {
    const prng = new Xorshift32(TEST_VECTORS.expectedCombinedSeed);
    const pegMap = generatePegMap(prng);

    // Check Row 0
    expect(pegMap.rows[0]).toHaveLength(1);
    expect(pegMap.rows[0][0].leftBias).toBeCloseTo(
      TEST_VECTORS.expectedPegMapRow0[0],
      6
    );

    // Check Row 1
    expect(pegMap.rows[1]).toHaveLength(2);
    expect(pegMap.rows[1][0].leftBias).toBeCloseTo(
      TEST_VECTORS.expectedPegMapRow1[0],
      6
    );
    expect(pegMap.rows[1][1].leftBias).toBeCloseTo(
      TEST_VECTORS.expectedPegMapRow1[1],
      6
    );

    // Check Row 2
    expect(pegMap.rows[2]).toHaveLength(3);
    expect(pegMap.rows[2][0].leftBias).toBeCloseTo(
      TEST_VECTORS.expectedPegMapRow2[0],
      6
    );
    expect(pegMap.rows[2][1].leftBias).toBeCloseTo(
      TEST_VECTORS.expectedPegMapRow2[1],
      6
    );
    expect(pegMap.rows[2][2].leftBias).toBeCloseTo(
      TEST_VECTORS.expectedPegMapRow2[2],
      6
    );
  });

  test('Peg map leftBias values are within [0.4, 0.6] range', () => {
    const prng = new Xorshift32(TEST_VECTORS.expectedCombinedSeed);
    const pegMap = generatePegMap(prng);

    pegMap.rows.forEach((row) => {
      row.forEach((peg) => {
        expect(peg.leftBias).toBeGreaterThanOrEqual(0.4);
        expect(peg.leftBias).toBeLessThanOrEqual(0.6);
      });
    });
  });

  test('Peg map hash is stable and reproducible', () => {
    const prng1 = new Xorshift32(TEST_VECTORS.expectedCombinedSeed);
    const pegMap1 = generatePegMap(prng1);
    const hash1 = hashPegMap(pegMap1);

    const prng2 = new Xorshift32(TEST_VECTORS.expectedCombinedSeed);
    const pegMap2 = generatePegMap(prng2);
    const hash2 = hashPegMap(pegMap2);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
  });
});

describe('Plinko Outcome Computation', () => {
  test('Complete outcome matches test vector bin index', () => {
    const result = computePlinkoOutcome(
      TEST_VECTORS.expectedCombinedSeed,
      TEST_VECTORS.dropColumn
    );

    expect(result.binIndex).toBe(TEST_VECTORS.expectedBinIndex);
  });

  test('Outcome is deterministic - same inputs produce same results', () => {
    const result1 = computePlinkoOutcome(
      TEST_VECTORS.expectedCombinedSeed,
      TEST_VECTORS.dropColumn
    );
    const result2 = computePlinkoOutcome(
      TEST_VECTORS.expectedCombinedSeed,
      TEST_VECTORS.dropColumn
    );

    expect(result1.binIndex).toBe(result2.binIndex);
    expect(result1.pegMapHash).toBe(result2.pegMapHash);
    expect(result1.path).toEqual(result2.path);
  });

  test('Path has 12 decisions (one per row)', () => {
    const result = computePlinkoOutcome(
      TEST_VECTORS.expectedCombinedSeed,
      TEST_VECTORS.dropColumn
    );

    expect(result.path).toHaveLength(12);
  });

  test('Final bin index equals number of RIGHT decisions', () => {
    const result = computePlinkoOutcome(
      TEST_VECTORS.expectedCombinedSeed,
      TEST_VECTORS.dropColumn
    );

    const rightCount = result.path.filter((d) => d.decision === 'RIGHT').length;
    expect(result.binIndex).toBe(rightCount);
  });

  test('Drop column influence affects outcome', () => {
    const leftResult = computePlinkoOutcome(
      TEST_VECTORS.expectedCombinedSeed,
      0 // Far left
    );
    const rightResult = computePlinkoOutcome(
      TEST_VECTORS.expectedCombinedSeed,
      12 // Far right
    );

    // Different drop columns should generally produce different outcomes
    // (though not guaranteed for every seed)
    expect(leftResult.binIndex).not.toBe(rightResult.binIndex);
  });

  test('Bin index is always within valid range [0-12]', () => {
    for (let dropCol = 0; dropCol <= 12; dropCol++) {
      const result = computePlinkoOutcome(
        TEST_VECTORS.expectedCombinedSeed,
        dropCol
      );
      expect(result.binIndex).toBeGreaterThanOrEqual(0);
      expect(result.binIndex).toBeLessThanOrEqual(12);
    }
  });

  test('Invalid drop column throws error', () => {
    expect(() => {
      computePlinkoOutcome(TEST_VECTORS.expectedCombinedSeed, -1);
    }).toThrow();

    expect(() => {
      computePlinkoOutcome(TEST_VECTORS.expectedCombinedSeed, 13);
    }).toThrow();
  });
});

describe('Payout System', () => {
  test('Center bin has lowest multiplier', () => {
    const centerMultiplier = getMultiplier(6);
    expect(centerMultiplier).toBe(0.5);
  });

  test('Edge bins have highest multipliers', () => {
    const leftEdge = getMultiplier(0);
    const rightEdge = getMultiplier(12);
    expect(leftEdge).toBe(16.0);
    expect(rightEdge).toBe(16.0);
  });

  test('Paytable is symmetric', () => {
    for (let i = 0; i < 6; i++) {
      const leftMultiplier = getMultiplier(i);
      const rightMultiplier = getMultiplier(12 - i);
      expect(leftMultiplier).toBe(rightMultiplier);
    }
  });
});

describe('Integration Tests', () => {
  test('Full round flow: commit → reveal → compute → verify', () => {
    const { serverSeed, nonce, clientSeed, dropColumn } = TEST_VECTORS;

    // Step 1: Generate commit
    const commitHex = generateCommitHex(serverSeed, nonce);
    expect(commitHex).toBe(TEST_VECTORS.expectedCommitHex);

    // Step 2: Player provides client seed, server computes combined seed
    const combinedSeed = generateCombinedSeed(serverSeed, clientSeed, nonce);
    expect(combinedSeed).toBe(TEST_VECTORS.expectedCombinedSeed);

    // Step 3: Compute outcome
    const result = computePlinkoOutcome(combinedSeed, dropColumn);
    expect(result.binIndex).toBe(TEST_VECTORS.expectedBinIndex);

    // Step 4: Verify commit
    const isValid = verifyCommit(commitHex, serverSeed, nonce);
    expect(isValid).toBe(true);

    // Step 5: Re-compute to verify determinism
    const verifyResult = computePlinkoOutcome(combinedSeed, dropColumn);
    expect(verifyResult.binIndex).toBe(result.binIndex);
    expect(verifyResult.pegMapHash).toBe(result.pegMapHash);
  });
});
