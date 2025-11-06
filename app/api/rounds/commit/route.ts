/**
 * POST /api/rounds/commit
 * 
 * Creates a new round with server-generated seed and nonce.
 * Returns the commit hash (without revealing the server seed).
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateSecureRandomHex,
  generateNonce,
  generateCommitHex,
} from '@/lib/fairness';
import { ROWS } from '@/lib/plinko-engine';

export async function POST() {
  try {
    // Generate server seed and nonce
    const serverSeed = generateSecureRandomHex(32);
    const nonce = generateNonce();

    // Generate commit hash (this is what we show to the client)
    const commitHex = generateCommitHex(serverSeed, nonce);

    // Create the round in database with status CREATED
    const round = await prisma.round.create({
      data: {
        status: 'CREATED',
        nonce,
        commitHex,
        serverSeed, // Stored but not revealed yet
        clientSeed: '', // Will be set when round starts
        combinedSeed: '', // Will be computed when round starts
        pegMapHash: '', // Will be computed when round starts
        rows: ROWS,
        dropColumn: 0, // Will be set when round starts
        binIndex: 0, // Will be computed when round starts
        payoutMultiplier: 0, // Will be computed when round starts
        betCents: 0, // Will be set when round starts
        pathJson: [], // Will be computed when round starts
      },
    });

    return NextResponse.json({
      roundId: round.id,
      commitHex: round.commitHex,
      nonce: round.nonce,
    });
  } catch (error) {
    console.error('Error creating round:', error);
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    );
  }
}
