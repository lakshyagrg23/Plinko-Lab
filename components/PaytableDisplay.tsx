/**
 * Paytable Display Component
 * 
 * Shows the payout multipliers for each bin.
 */

'use client';

import { PAYTABLE } from '@/lib/payout';

export default function PaytableDisplay() {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-bold text-white mb-4">Payout Multipliers</h3>
      <div className="grid grid-cols-13 gap-1">
        {PAYTABLE.map((entry) => (
          <div
            key={entry.bin}
            className="flex flex-col items-center justify-center p-2 rounded"
            style={{ backgroundColor: entry.color + '40' }}
          >
            <div className="text-xs text-gray-400">{entry.bin}</div>
            <div className="text-sm font-bold text-white">{entry.multiplier}x</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-gray-400 text-center">
        <p>Higher multipliers at edges • Lower in center • Symmetric distribution</p>
      </div>
    </div>
  );
}
