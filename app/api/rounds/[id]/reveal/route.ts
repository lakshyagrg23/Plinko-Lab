/**
 * POST /api/rounds/[id]/reveal
 * 
 * Reveals the server seed after the round is complete.
 * This allows the client to verify the fairness of the outcome.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the round
    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'STARTED') {
      return NextResponse.json(
        { error: 'Round must be started before revealing' },
        { status: 400 }
      );
    }

    // Update status to REVEALED
    const updatedRound = await prisma.round.update({
      where: { id },
      data: {
        status: 'REVEALED',
        revealedAt: new Date(),
      },
    });

    // Now we can reveal the server seed
    return NextResponse.json({
      roundId: updatedRound.id,
      serverSeed: updatedRound.serverSeed,
      nonce: updatedRound.nonce,
      clientSeed: updatedRound.clientSeed,
      commitHex: updatedRound.commitHex,
      combinedSeed: updatedRound.combinedSeed,
    });
  } catch (error) {
    console.error('Error revealing round:', error);
    return NextResponse.json(
      { error: 'Failed to reveal round' },
      { status: 500 }
    );
  }
}
