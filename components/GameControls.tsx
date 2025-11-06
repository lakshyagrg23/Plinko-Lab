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
      className="bg-gray-800 rounded-lg p-6 space-y-6"
      onKeyDown={handleKeyPress}
      tabIndex={0}
    >
      {/* Drop Column Selector */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Drop Column: <span className="text-xl font-bold text-white">{dropColumn}</span>
        </label>
        <input
          type="range"
          min="0"
          max="12"
          value={dropColumn}
          onChange={(e) => setDropColumn(Number(e.target.value))}
          disabled={isPlaying || disabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 (Left)</span>
          <span>6 (Center)</span>
          <span>12 (Right)</span>
        </div>
      </div>

      {/* Bet Amount */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Bet Amount
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max="100000"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            disabled={isPlaying || disabled}
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="flex items-center text-gray-400">cents</span>
        </div>
        <div className="flex gap-2">
          {[10, 50, 100, 500, 1000].map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={isPlaying || disabled}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {amount >= 100 ? `$${(amount / 100).toFixed(2)}` : `${amount}¢`}
            </button>
          ))}
        </div>
      </div>

      {/* Client Seed (Optional) */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Client Seed (Optional)
          <span className="text-xs text-gray-500 ml-2">For provably fair verification</span>
        </label>
        <input
          type="text"
          value={clientSeed}
          onChange={(e) => setClientSeed(e.target.value)}
          disabled={isPlaying || disabled}
          placeholder="Auto-generated if empty"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Drop Button */}
      <button
        onClick={handleDrop}
        disabled={isPlaying || disabled}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
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
