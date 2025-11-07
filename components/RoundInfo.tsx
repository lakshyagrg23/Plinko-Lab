/**
 * Round Info Display Component
 * 
 * Shows current round information including fairness data.
 */

'use client';

import { useState } from 'react';

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
  dropColumn?: number;
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
  dropColumn,
}: RoundInfoProps) {
  const [copied, setCopied] = useState(false);

  const generateVerifyLink = () => {
    if (!serverSeed || !clientSeed || !nonce || dropColumn === undefined) return '';
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      serverSeed,
      clientSeed,
      nonce,
      dropColumn: dropColumn.toString(),
    });
    
    return `${baseUrl}/verify?${params.toString()}`;
  };

  const copyVerifyLink = async () => {
    const link = generateVerifyLink();
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  if (!roundId) {
    return (
      <div 
        className="rounded-lg p-4 sm:p-6 text-center transition-colors duration-300"
        style={{
          backgroundColor: 'var(--background-secondary)',
          color: 'var(--foreground-secondary)',
          borderColor: 'var(--border)',
          borderWidth: '1px',
          borderStyle: 'solid',
        }}
        role="status"
        aria-live="polite"
      >
        <p className="text-sm sm:text-base">No active round. Click &ldquo;Drop Ball&rdquo; to start!</p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--background-secondary)',
        borderColor: 'var(--border)',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
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

        {status === 'REVEALED' && serverSeed && clientSeed && dropColumn !== undefined && (
          <div className="mt-4 space-y-2">
            <a
              href={generateVerifyLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Verify This Round →
            </a>
            
            <button
              onClick={copyVerifyLink}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label="Copy verification link to clipboard"
            >
              {copied ? '✓ Copied!' : '📋 Copy Verify Link'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
