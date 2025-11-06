/**
 * Verifier Page - Public Fairness Verification
 * 
 * Allows anyone to verify the fairness of a round by providing
 * the server seed, client seed, nonce, and drop column.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PathDecision } from '@/lib/plinko-engine';

interface VerificationResult {
  inputs: {
    serverSeed: string;
    clientSeed: string;
    nonce: string;
    dropColumn: number;
  };
  computed: {
    commitHex: string;
    combinedSeed: string;
    pegMapHash: string;
    binIndex: number;
    path: PathDecision[];
  };
  timestamp: string;
}

export default function VerifyPage() {
  const [serverSeed, setServerSeed] = useState('');
  const [clientSeed, setClientSeed] = useState('');
  const [nonce, setNonce] = useState('');
  const [dropColumn, setDropColumn] = useState('6');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        serverSeed,
        clientSeed,
        nonce,
        dropColumn,
      });

      const res = await fetch(`/api/verify?${params}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTestVector = () => {
    setServerSeed('b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc');
    setClientSeed('candidate-hello');
    setNonce('42');
    setDropColumn('6');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Fairness Verifier
          </h1>
          <p className="text-gray-400">
            Independently verify any Plinko round outcome
          </p>
          <Link
            href="/"
            className="inline-block mt-2 text-sm text-blue-400 hover:text-blue-300 underline"
          >
            ← Back to Game
          </Link>
        </header>

        {/* Verification Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Verify Round Outcome</h2>
          
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Server Seed
              </label>
              <input
                type="text"
                value={serverSeed}
                onChange={(e) => setServerSeed(e.target.value)}
                required
                placeholder="64-character hex string"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Seed
              </label>
              <input
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                required
                placeholder="Your custom seed"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nonce
              </label>
              <input
                type="text"
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                required
                placeholder="Round nonce"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Drop Column (0-12)
              </label>
              <input
                type="number"
                min="0"
                max="12"
                value={dropColumn}
                onChange={(e) => setDropColumn(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify Outcome'}
              </button>
              
              <button
                type="button"
                onClick={loadTestVector}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Load Test Vector
              </button>
            </div>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            <p className="font-bold">❌ Verification Failed</p>
            <p>{error}</p>
          </div>
        )}

        {/* Verification Result */}
        {result && (
          <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl">✅</div>
              <div>
                <h3 className="text-2xl font-bold text-green-500">Verification Successful</h3>
                <p className="text-gray-400 text-sm">
                  Outcome is deterministically reproducible
                </p>
              </div>
            </div>

            {/* Computed Values */}
            <div className="border-t border-gray-700 pt-4 space-y-3">
              <h4 className="font-bold text-lg">Computed Values</h4>
              
              <div>
                <span className="text-gray-400 text-sm">Commit Hash:</span>
                <p className="text-white font-mono text-sm break-all mt-1 bg-gray-900 p-2 rounded">
                  {result.computed.commitHex}
                </p>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Combined Seed:</span>
                <p className="text-white font-mono text-sm break-all mt-1 bg-gray-900 p-2 rounded">
                  {result.computed.combinedSeed}
                </p>
              </div>

              <div>
                <span className="text-gray-400 text-sm">Peg Map Hash:</span>
                <p className="text-white font-mono text-sm break-all mt-1 bg-gray-900 p-2 rounded">
                  {result.computed.pegMapHash}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-900 p-4 rounded">
                  <span className="text-gray-400 text-sm">Landing Bin</span>
                  <p className="text-3xl font-bold text-green-500 mt-1">
                    {result.computed.binIndex}
                  </p>
                </div>

                <div className="bg-gray-900 p-4 rounded">
                  <span className="text-gray-400 text-sm">Path Length</span>
                  <p className="text-3xl font-bold text-blue-500 mt-1">
                    {result.computed.path.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Path Visualization */}
            <div className="border-t border-gray-700 pt-4">
              <h4 className="font-bold text-lg mb-3">Deterministic Path</h4>
              <div className="bg-gray-900 p-4 rounded space-y-2 max-h-64 overflow-y-auto">
                {result.computed.path.map((decision, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className="text-gray-500 w-16">Row {decision.row}:</span>
                    <span className={`font-bold w-12 ${
                      decision.decision === 'LEFT' ? 'text-blue-400' : 'text-orange-400'
                    }`}>
                      {decision.decision}
                    </span>
                    <span className="text-gray-600 text-xs">
                      (rnd: {decision.randomValue.toFixed(6)} vs bias: {decision.adjustedBias.toFixed(6)})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Verified at: {new Date(result.timestamp).toLocaleString()}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">How Provably Fair Works</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <p className="font-bold text-white mb-1">1. Commit Phase</p>
              <p>
                Server generates a random server seed and nonce, then publishes only the 
                SHA-256 hash: <code className="bg-gray-900 px-1 py-0.5 rounded">commitHex = SHA256(serverSeed:nonce)</code>
              </p>
            </div>

            <div>
              <p className="font-bold text-white mb-1">2. Player Input</p>
              <p>
                You provide a client seed (or one is generated for you). The server cannot 
                change the outcome after this point.
              </p>
            </div>

            <div>
              <p className="font-bold text-white mb-1">3. Outcome Generation</p>
              <p>
                A combined seed is generated: <code className="bg-gray-900 px-1 py-0.5 rounded">SHA256(serverSeed:clientSeed:nonce)</code>
                <br />
                This seed drives a deterministic PRNG (xorshift32) that produces the entire game outcome.
              </p>
            </div>

            <div>
              <p className="font-bold text-white mb-1">4. Reveal & Verify</p>
              <p>
                After the round, the server reveals the server seed. You can verify that:
                <br />
                • The commit hash matches SHA256(serverSeed:nonce)
                <br />
                • The outcome can be reproduced from the seeds
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
