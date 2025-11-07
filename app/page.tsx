/**
 * Plinko Lab - Main Game Page
 * Provably fair Plinko game with commit-reveal protocol
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlinkoBoard from '@/components/PlinkoBoard';
import GameControls from '@/components/GameControls';
import PaytableDisplay from '@/components/PaytableDisplay';
import RoundInfo from '@/components/RoundInfo';
import MuteToggle from '@/components/MuteToggle';
import Confetti from '@/components/Confetti';
import { PathDecision } from '@/lib/plinko-engine';
import { useSoundEffects } from '@/lib/useSoundEffects';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface RoundData {
  roundId: string;
  commitHex: string;
  nonce: string;
  clientSeed: string;
  serverSeed?: string;
  pegMapHash: string;
  path: PathDecision[];
  binIndex: number;
  payoutMultiplier: number;
  payout: number;
  status: string;
  dropColumn: number;
}

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Sound effects hook
  const { isMuted, toggleMute, playPegSound, playLandingSound, playWinSound } = useSoundEffects();
  
  // Accessibility: Detect reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  const handleDrop = async (dropColumn: number, betCents: number, clientSeed: string) => {
    setError(null);
    setIsPlaying(true);

    try {
      // Step 1: Commit
      const commitRes = await fetch('/api/rounds/commit', {
        method: 'POST',
      });
      
      if (!commitRes.ok) {
        throw new Error('Failed to create round');
      }

      const { roundId, commitHex, nonce } = await commitRes.json();

      // Step 2: Start round
      const startRes = await fetch(`/api/rounds/${roundId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSeed, betCents, dropColumn }),
      });

      if (!startRes.ok) {
        throw new Error('Failed to start round');
      }

      const startData = await startRes.json();

      // Update state with round data (without server seed yet)
      setCurrentRound({
        roundId,
        commitHex,
        nonce,
        clientSeed,
        pegMapHash: startData.pegMapHash,
        path: startData.path,
        binIndex: startData.binIndex,
        payoutMultiplier: startData.payoutMultiplier,
        payout: startData.payout,
        status: 'STARTED',
        dropColumn,
      });

      // Wait for animation to complete before revealing
      setTimeout(async () => {
        // Step 3: Reveal server seed
        const revealRes = await fetch(`/api/rounds/${roundId}/reveal`, {
          method: 'POST',
        });

        if (revealRes.ok) {
          const revealData = await revealRes.json();
          setCurrentRound((prev) => prev ? {
            ...prev,
            serverSeed: revealData.serverSeed,
            status: 'REVEALED',
          } : null);
        }

        setIsPlaying(false);
      }, 2000); // Give time for animation

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Plinko Lab
          </h1>
          <p className="text-sm sm:text-base text-gray-400">Provably Fair Gaming with Commit-Reveal Protocol</p>
          <Link
            href="/verify"
            className="inline-block mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Verify Fairness →
          </Link>
          
          {/* Accessibility Indicators */}
          <div className="flex justify-center gap-2 sm:gap-4 mt-4 flex-wrap">
            <MuteToggle isMuted={isMuted} onToggle={toggleMute} />
            {prefersReducedMotion && (
              <div 
                className="px-3 py-1 bg-blue-900/50 border border-blue-500 rounded-full text-xs text-blue-300"
                role="status"
                aria-live="polite"
              >
                ⚡ Reduced Motion Active
              </div>
            )}
          </div>
        </header>

        {/* Error Display */}
        {error && (
          <div 
            className="mb-4 sm:mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-bold">Error:</p>
            <p className="text-sm sm:text-base">{error}</p>
          </div>
        )}

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Controls & Info */}
          <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
            <GameControls
              onDrop={handleDrop}
              isPlaying={isPlaying}
            />
            
            <RoundInfo
              roundId={currentRound?.roundId}
              commitHex={currentRound?.commitHex}
              nonce={currentRound?.nonce}
              clientSeed={currentRound?.clientSeed}
              serverSeed={currentRound?.serverSeed}
              binIndex={currentRound?.binIndex}
              payout={currentRound?.payout}
              payoutMultiplier={currentRound?.payoutMultiplier}
              status={currentRound?.status}
              dropColumn={currentRound?.dropColumn}
            />
          </div>

          {/* Center Column: Game Board */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <PlinkoBoard
              path={currentRound?.path}
              binIndex={currentRound?.binIndex}
              isAnimating={isPlaying}
              onPegHit={playPegSound}
              onAnimationComplete={() => {
                // Play landing sound and trigger confetti for big wins
                if (currentRound?.payoutMultiplier) {
                  if (currentRound.payoutMultiplier >= 5) {
                    playWinSound(); // Big win!
                    setShowConfetti(true); // Trigger confetti
                  } else if (currentRound.payoutMultiplier >= 2) {
                    playLandingSound(currentRound.payoutMultiplier);
                    setShowConfetti(true); // Smaller confetti for medium wins
                  } else {
                    playLandingSound(currentRound.payoutMultiplier);
                  }
                }
              }}
            />
            
            <div className="mt-4 sm:mt-6">
              <PaytableDisplay />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            This is a demonstration of provably fair gaming. No real money involved.
          </p>
          <p className="mt-2">
            All outcomes are deterministic and verifiable through cryptographic proofs.
          </p>
          <p className="mt-4 text-xs text-gray-600">
            💡 Easter Eggs: Press <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">T</kbd> for TILT mode, 
            <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 ml-1">G</kbd> for Debug Grid
          </p>
        </footer>
      </div>

      {/* Confetti effect for wins */}
      <Confetti
        active={showConfetti}
        multiplier={currentRound?.payoutMultiplier}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  );
}
