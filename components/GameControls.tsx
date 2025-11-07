/**
 * Game Controls Component
 * 
 * Handles user input for drop column selection, bet amount, and drop button.
 */

'use client';

import { useState } from 'react';

interface GameControlsProps {
  onDrop: (dropColumn: number, betCents: number, clientSeed: string) => void;
  isPlaying: boolean;
  disabled?: boolean;
}

export default function GameControls({
  onDrop,
  isPlaying,
  disabled = false,
}: GameControlsProps) {
  const [dropColumn, setDropColumn] = useState(6); // Center
  const [betAmount, setBetAmount] = useState(100); // $1.00
  const [clientSeed, setClientSeed] = useState('');

  const handleDrop = () => {
    if (isPlaying || disabled) return;
    
    // Generate client seed if not provided
    const seed = clientSeed || `player-${Date.now()}-${Math.random()}`;
    setClientSeed(seed);
    
    onDrop(dropColumn, betAmount, seed);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (isPlaying || disabled) return;

    if (e.key === 'ArrowLeft' && dropColumn > 0) {
      setDropColumn(dropColumn - 1);
    } else if (e.key === 'ArrowRight' && dropColumn < 12) {
      setDropColumn(dropColumn + 1);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleDrop();
    }
  };

  return (
    <div 
      className="rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--background-secondary)',
        borderColor: 'var(--border)',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
      onKeyDown={handleKeyPress}
      tabIndex={0}
      role="region"
      aria-label="Game Controls"
    >
      {/* Drop Column Selector */}
      <div className="space-y-2 sm:space-y-3">
        <label htmlFor="drop-column" className="block text-sm font-medium text-gray-300">
          Drop Column: <span className="text-xl font-bold text-white">{dropColumn}</span>
        </label>
        <input
          id="drop-column"
          type="range"
          min="0"
          max="12"
          value={dropColumn}
          onChange={(e) => setDropColumn(Number(e.target.value))}
          disabled={isPlaying || disabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-manipulation"
          style={{ minHeight: '44px' }} // Touch target size
          aria-label={`Drop column ${dropColumn}`}
          aria-valuemin={0}
          aria-valuemax={12}
          aria-valuenow={dropColumn}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 (Left)</span>
          <span className="hidden sm:inline">6 (Center)</span>
          <span className="sm:hidden">6</span>
          <span>12 (Right)</span>
        </div>
      </div>

      {/* Bet Amount */}
      <div className="space-y-2 sm:space-y-3">
        <label htmlFor="bet-amount" className="block text-sm font-medium text-gray-300">
          Bet Amount
        </label>
        <div className="flex gap-2">
          <input
            id="bet-amount"
            type="number"
            min="1"
            max="100000"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            disabled={isPlaying || disabled}
            className="flex-1 px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px] touch-manipulation"
            aria-label="Bet amount in cents"
            aria-describedby="bet-amount-hint"
          />
          <span id="bet-amount-hint" className="flex items-center text-gray-400 text-sm sm:text-base">cents</span>
        </div>
        <div className="grid grid-cols-3 sm:flex sm:flex-row gap-2" role="group" aria-label="Quick bet amount selection">
          {[10, 50, 100, 500, 1000].map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={isPlaying || disabled}
              className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
              aria-label={`Set bet to ${amount >= 100 ? `$${(amount / 100).toFixed(2)}` : `${amount} cents`}`}
            >
              {amount >= 100 ? `$${(amount / 100).toFixed(2)}` : `${amount}¢`}
            </button>
          ))}
        </div>
      </div>

      {/* Client Seed (Optional) */}
      <div className="space-y-2 sm:space-y-3">
        <label htmlFor="client-seed" className="block text-sm font-medium text-gray-300">
          Client Seed (Optional)
          <span className="block sm:inline text-xs text-gray-500 sm:ml-2 mt-1 sm:mt-0">For provably fair verification</span>
        </label>
        <input
          id="client-seed"
          type="text"
          value={clientSeed}
          onChange={(e) => setClientSeed(e.target.value)}
          disabled={isPlaying || disabled}
          placeholder="Auto-generated if empty"
          className="w-full px-3 sm:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
          aria-label="Client seed for provably fair verification"
          aria-describedby="client-seed-description"
        />
        <p id="client-seed-description" className="sr-only">
          Optional seed value for verifying game fairness. If left empty, a random seed will be generated.
        </p>
      </div>

      {/* Drop Button */}
      <button
        onClick={handleDrop}
        disabled={isPlaying || disabled}
        className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:from-blue-700 active:to-blue-600 text-white font-bold text-base sm:text-lg rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800 min-h-[56px] touch-manipulation"
        aria-label={isPlaying ? 'Ball is dropping, please wait' : 'Drop ball to start game'}
        aria-live="polite"
        aria-busy={isPlaying}
      >
        {isPlaying ? 'Dropping...' : 'Drop Ball'}
      </button>

      {/* Keyboard Hints */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>⌨️ Keyboard: ← → to select column, Space/Enter to drop</p>
      </div>
    </div>
  );
}
