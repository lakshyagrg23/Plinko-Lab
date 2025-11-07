/**
 * Paytable Display Component
 * 
 * Shows the payout multipliers for each bin.
 */

'use client';

import { PAYTABLE } from '@/lib/payout';

export default function PaytableDisplay() {
  return (
    <div 
      className="rounded-lg p-4 sm:p-6 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--background-secondary)',
        borderColor: 'var(--border)',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
      role="region"
      aria-label="Payout Multipliers Table"
    >
      <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Payout Multipliers</h3>
      <div className="grid grid-cols-13 gap-0.5 sm:gap-1 overflow-x-auto">
        {PAYTABLE.map((entry) => (
          <div
            key={entry.bin}
            className="flex flex-col items-center justify-center p-1 sm:p-2 rounded min-w-0"
            style={{ backgroundColor: entry.color + '40' }}
            role="cell"
            aria-label={`Bin ${entry.bin}: ${entry.multiplier}x multiplier`}
          >
            <div className="text-xs text-gray-400 leading-tight">{entry.bin}</div>
            <div className="text-xs sm:text-sm font-bold text-white leading-tight">{entry.multiplier}x</div>
          </div>
        ))}
      </div>
      <div className="mt-3 sm:mt-4 text-xs text-gray-400 text-center">
        <p className="hidden sm:block">Higher multipliers at edges • Lower in center • Symmetric distribution</p>
        <p className="sm:hidden">Higher at edges • Lower in center</p>
      </div>
    </div>
  );
}
