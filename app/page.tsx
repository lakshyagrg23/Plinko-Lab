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
import { PathDecision } from '@/lib/plinko-engine';
import { useSoundEffects } from '@/lib/useSoundEffects';

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
}

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRound, setCurrentRound] = useState<RoundData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Sound effects hook
  const { isMuted, toggleMute, playPegSound, playLandingSound, playWinSound } = useSoundEffects();

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
      {/* Mute Toggle Button */}
      <MuteToggle isMuted={isMuted} onToggle={toggleMute} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Plinko Lab
          </h1>
          <p className="text-gray-400">Provably Fair Gaming with Commit-Reveal Protocol</p>
          <Link
            href="/verify"
            className="inline-block mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Verify Fairness →
          </Link>
        </header>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Main Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Controls & Info */}
          <div className="space-y-6">
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
            />
          </div>

          {/* Center Column: Game Board */}
          <div className="lg:col-span-2">
            <PlinkoBoard
              path={currentRound?.path}
              binIndex={currentRound?.binIndex}
              isAnimating={isPlaying}
              onPegHit={playPegSound}
              onAnimationComplete={() => {
                // Play landing sound when animation completes
                if (currentRound?.payoutMultiplier) {
                  if (currentRound.payoutMultiplier >= 5) {
                    playWinSound(); // Big win!
                  } else {
                    playLandingSound(currentRound.payoutMultiplier);
                  }
                }
              }}
            />
            
            <div className="mt-6">
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
        </footer>
      </div>
    </div>
  );
}
