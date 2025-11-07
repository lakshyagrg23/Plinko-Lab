/**
 * POST /api/rounds/[id]/start
 * 
 * Starts a round with client seed, bet amount, and drop column.
 * Computes the outcome but does NOT reveal the server seed yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCombinedSeed } from '@/lib/fairness';
import { computePlinkoOutcome } from '@/lib/plinko-engine';
import { getMultiplier } from '@/lib/payout';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientSeed, betCents, dropColumn } = body;

    // Validate inputs
    if (!clientSeed || typeof clientSeed !== 'string') {
      return NextResponse.json(
        { error: 'clientSeed is required and must be a string' },
        { status: 400 }
      );
    }

    if (typeof betCents !== 'number' || betCents <= 0) {
      return NextResponse.json(
        { error: 'betCents must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof dropColumn !== 'number' || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: 'dropColumn must be between 0 and 12' },
        { status: 400 }
      );
    }

    // Get the round
    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'CREATED') {
      return NextResponse.json(
        { error: 'Round has already been started' },
        { status: 400 }
      );
    }

    // Generate combined seed
    const combinedSeed = generateCombinedSeed(
      round.serverSeed!,
      clientSeed,
      round.nonce
    );

    // Compute the outcome
    const outcome = computePlinkoOutcome(combinedSeed, dropColumn);

    // Get payout multiplier
    const payoutMultiplier = getMultiplier(outcome.binIndex);

    // Update the round
    const updatedRound = await prisma.round.update({
      where: { id },
      data: {
        status: 'STARTED',
        clientSeed,
        combinedSeed,
        pegMapHash: outcome.pegMapHash,
        dropColumn,
        binIndex: outcome.binIndex,
        payoutMultiplier,
        betCents,
        pathJson: JSON.parse(JSON.stringify(outcome.path)),
      },
    });

    // Return data WITHOUT revealing serverSeed
    return NextResponse.json({
      roundId: updatedRound.id,
      pegMapHash: updatedRound.pegMapHash,
      rows: updatedRound.rows,
      path: outcome.path,
      binIndex: outcome.binIndex,
      payoutMultiplier: payoutMultiplier,
      payout: betCents * payoutMultiplier,
    });
  } catch (error) {
    console.error('Error starting round:', error);
    return NextResponse.json(
      { error: 'Failed to start round' },
      { status: 500 }
    );
  }
}
