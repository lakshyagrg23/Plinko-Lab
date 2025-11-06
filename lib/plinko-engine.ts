/**
 * Deterministic Plinko Engine
 * 
 * This module implements the discrete Plinko model that is 100% deterministic
 * and replayable from a seed. All randomness comes from the fairness PRNG.
 * 
 * Specification:
 * - 12 rows, 13 bins (indexed 0-12)
 * - Each row r has r+1 pegs with leftBias in [0.4, 0.6]
 * - leftBias = 0.5 + (rand() - 0.5) * 0.2
 * - Drop column influences bias: adj = (dropColumn - 6) * 0.01
 * - Path is deterministic: at row r, use peg at min(pos, r)
 */

import { Xorshift32, sha256 } from './fairness';

export interface Peg {
  leftBias: number; // Probability of going left, rounded to 6 decimals
}

export interface PegMap {
  rows: Peg[][]; // rows[r] contains r+1 pegs
}

export interface PathDecision {
  row: number;
  pegIndex: number;
  leftBias: number;
  adjustedBias: number;
  randomValue: number;
  decision: 'LEFT' | 'RIGHT';
}

export interface PlinkoResult {
  pegMap: PegMap;
  pegMapHash: string;
  path: PathDecision[];
  binIndex: number; // Final landing bin (0-12)
}

export const ROWS = 12;
export const BINS = 13;

/**
 * Generate the peg map for the board
 * Each peg gets a leftBias = 0.5 + (rand() - 0.5) * 0.2
 * This gives a range of [0.4, 0.6] centered at 0.5
 */
export function generatePegMap(prng: Xorshift32): PegMap {
  const rows: Peg[][] = [];

  for (let r = 0; r < ROWS; r++) {
    const pegCount = r + 1;
    const pegRow: Peg[] = [];

    for (let p = 0; p < pegCount; p++) {
      const rand = prng.next();
      // leftBias = 0.5 + (rand - 0.5) * 0.2 → [0.4, 0.6]
      const leftBias = 0.5 + (rand - 0.5) * 0.2;
      // Round to 6 decimals for stable hashing
      const roundedLeftBias = Number(leftBias.toFixed(6));
      pegRow.push({ leftBias: roundedLeftBias });
    }

    rows.push(pegRow);
  }

  return { rows };
}

/**
 * Calculate SHA-256 hash of the peg map for verification
 * This ensures the peg map hasn't been tampered with
 */
export function hashPegMap(pegMap: PegMap): string {
  return sha256(JSON.stringify(pegMap));
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Simulate the ball drop through the peg map
 * 
 * @param pegMap - The generated peg map
 * @param dropColumn - Player's chosen drop column (0-12)
 * @param prng - PRNG instance (already used for peg generation)
 * @returns Path decisions and final bin
 */
export function simulateDrop(
  pegMap: PegMap,
  dropColumn: number,
  prng: Xorshift32
): { path: PathDecision[]; binIndex: number } {
  const path: PathDecision[] = [];
  let pos = 0; // Number of RIGHT moves so far

  // Calculate drop column adjustment
  const centerColumn = Math.floor(ROWS / 2); // 6 for 12 rows
  const adj = (dropColumn - centerColumn) * 0.01;

  for (let r = 0; r < ROWS; r++) {
    // Get the peg at the current path position
    const pegIndex = Math.min(pos, r);
    const peg = pegMap.rows[r][pegIndex];

    // Apply drop column bias adjustment
    const adjustedBias = clamp(peg.leftBias + adj, 0, 1);

    // Get random value from PRNG
    const randomValue = prng.next();

    // Make decision
    const decision = randomValue < adjustedBias ? 'LEFT' : 'RIGHT';

    // Record the decision
    path.push({
      row: r,
      pegIndex,
      leftBias: peg.leftBias,
      adjustedBias,
      randomValue,
      decision,
    });

    // Update position
    if (decision === 'RIGHT') {
      pos += 1;
    }
  }

  // Final bin is the number of RIGHT moves
  const binIndex = pos;

  return { path, binIndex };
}

/**
 * Complete Plinko round computation
 * This is the main entry point for generating a deterministic outcome
 * 
 * @param combinedSeed - The combined seed from fairness protocol
 * @param dropColumn - Player's chosen drop column (0-12)
 * @returns Complete Plinko result with peg map, path, and bin
 */
export function computePlinkoOutcome(
  combinedSeed: string,
  dropColumn: number
): PlinkoResult {
  // Validate inputs
  if (dropColumn < 0 || dropColumn > BINS - 1) {
    throw new Error(`Invalid dropColumn: ${dropColumn}. Must be 0-${BINS - 1}`);
  }

  // Initialize PRNG from combined seed
  const prng = new Xorshift32(combinedSeed);

  // Generate peg map (uses PRNG first)
  const pegMap = generatePegMap(prng);

  // Calculate peg map hash for verification
  const pegMapHash = hashPegMap(pegMap);

  // Simulate drop (uses PRNG second, maintaining order)
  const { path, binIndex } = simulateDrop(pegMap, dropColumn, prng);

  return {
    pegMap,
    pegMapHash,
    path,
    binIndex,
  };
}

/**
 * Replay a round from stored data for verification
 * This recomputes the outcome and compares it to stored values
 */
export function replayRound(
  combinedSeed: string,
  dropColumn: number,
  expectedBinIndex: number,
  expectedPegMapHash: string
): { matches: boolean; result: PlinkoResult } {
  const result = computePlinkoOutcome(combinedSeed, dropColumn);

  const matches =
    result.binIndex === expectedBinIndex &&
    result.pegMapHash === expectedPegMapHash;

  return { matches, result };
}
