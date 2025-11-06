/**
 * Payout System
 * 
 * Defines the paytable for each bin (0-12)
 * Symmetric distribution with higher multipliers at edges
 */

export interface PaytableEntry {
  bin: number;
  multiplier: number;
  color: string; // For UI visualization
}

/**
 * Symmetric paytable for 13 bins (0-12)
 * Higher multipliers at edges, lower in center
 * This creates the classic Plinko risk/reward profile
 */
export const PAYTABLE: PaytableEntry[] = [
  { bin: 0, multiplier: 16.0, color: '#ef4444' },  // Red - highest
  { bin: 1, multiplier: 9.0, color: '#f97316' },   // Orange
  { bin: 2, multiplier: 2.0, color: '#fbbf24' },   // Yellow
  { bin: 3, multiplier: 1.4, color: '#a3e635' },   // Light green
  { bin: 4, multiplier: 1.1, color: '#4ade80' },   // Green
  { bin: 5, multiplier: 1.0, color: '#22d3ee' },   // Cyan
  { bin: 6, multiplier: 0.5, color: '#60a5fa' },   // Blue - center, lowest
  { bin: 7, multiplier: 1.0, color: '#22d3ee' },   // Cyan
  { bin: 8, multiplier: 1.1, color: '#4ade80' },   // Green
  { bin: 9, multiplier: 1.4, color: '#a3e635' },   // Light green
  { bin: 10, multiplier: 2.0, color: '#fbbf24' },  // Yellow
  { bin: 11, multiplier: 9.0, color: '#f97316' },  // Orange
  { bin: 12, multiplier: 16.0, color: '#ef4444' }, // Red - highest
];

/**
 * Get multiplier for a specific bin
 */
export function getMultiplier(binIndex: number): number {
  if (binIndex < 0 || binIndex >= PAYTABLE.length) {
    throw new Error(`Invalid bin index: ${binIndex}`);
  }
  return PAYTABLE[binIndex].multiplier;
}

/**
 * Calculate payout amount
 */
export function calculatePayout(betCents: number, binIndex: number): number {
  const multiplier = getMultiplier(binIndex);
  return betCents * multiplier;
}

/**
 * Get color for a bin (for UI)
 */
export function getBinColor(binIndex: number): string {
  if (binIndex < 0 || binIndex >= PAYTABLE.length) {
    return '#6b7280'; // Gray fallback
  }
  return PAYTABLE[binIndex].color;
}

/**
 * Get paytable entry for a bin
 */
export function getPaytableEntry(binIndex: number): PaytableEntry {
  if (binIndex < 0 || binIndex >= PAYTABLE.length) {
    throw new Error(`Invalid bin index: ${binIndex}`);
  }
  return PAYTABLE[binIndex];
}
