/**
 * Round Info Display Component
 * 
 * Shows current round information including fairness data.
 */

'use client';

interface RoundInfoProps {
  roundId?: string;
  commitHex?: string;
  nonce?: string;
  clientSeed?: string;
  serverSeed?: string;
  binIndex?: number;
  payout?: number;
  payoutMultiplier?: number;
  status?: string;
}

export default function RoundInfo({
  roundId,
  commitHex,
  nonce,
  clientSeed,
  serverSeed,
  binIndex,
  payout,
  payoutMultiplier,
  status,
}: RoundInfoProps) {
  if (!roundId) {
    return (
      <div 
        className="bg-gray-800 rounded-lg p-4 sm:p-6 text-center text-gray-400"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm sm:text-base">No active round. Click &ldquo;Drop Ball&rdquo; to start!</p>
      </div>
    );
  }

  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4"
      role="region"
      aria-label="Round Information"
    >
      <h3 className="text-base sm:text-lg font-bold text-white">Round Information</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-start gap-2">
          <span className="text-gray-400 flex-shrink-0">Round ID:</span>
          <span className="text-white font-mono text-xs break-all text-right">{roundId}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={`font-bold ${
            status === 'REVEALED' ? 'text-green-500' :
            status === 'STARTED' ? 'text-yellow-500' :
            'text-blue-500'
          }`} role="status" aria-live="polite">
            {status}
          </span>
        </div>

        {binIndex !== undefined && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-400">Landing Bin:</span>
              <span className="text-white font-bold text-base sm:text-lg">{binIndex}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Multiplier:</span>
              <span className="text-white font-bold text-base sm:text-lg">{payoutMultiplier}x</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Payout:</span>
              <span className="text-green-500 font-bold text-base sm:text-lg">
                ${((payout || 0) / 100).toFixed(2)}
              </span>
            </div>
          </>
        )}

        <div className="border-t border-gray-700 pt-3 mt-3">
          <p className="text-xs text-gray-500 mb-2">Fairness Proof:</p>
          
          <div className="space-y-1">
            <div>
              <span className="text-gray-500 text-xs">Commit Hash:</span>
              <p className="text-gray-300 font-mono text-xs break-all">
                {commitHex}
              </p>
            </div>
            
            <div>
              <span className="text-gray-500 text-xs">Nonce:</span>
              <p className="text-gray-300 font-mono text-xs break-all">{nonce}</p>
            </div>
            
            {clientSeed && (
              <div>
                <span className="text-gray-500 text-xs">Client Seed:</span>
                <p className="text-gray-300 font-mono text-xs break-all">
                  {clientSeed}
                </p>
              </div>
            )}
            
            {serverSeed && (
              <div>
                <span className="text-green-500 text-xs">✓ Server Seed (Revealed):</span>
                <p className="text-gray-300 font-mono text-xs break-all">
                  {serverSeed}
                </p>
              </div>
            )}
          </div>
        </div>

        {status === 'REVEALED' && (
          <a
            href={`/verify?roundId=${roundId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-center py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm font-medium transition-colors"
          >
            Verify This Round →
          </a>
        )}
      </div>
    </div>
  );
}
