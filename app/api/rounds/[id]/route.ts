/**
 * GET /api/rounds/[id]
 * 
 * Retrieves full details of a round.
 * Server seed is only included if the round has been revealed.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const round = await prisma.round.findUnique({
      where: { id },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    // Build response based on round status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = {
      id: round.id,
      createdAt: round.createdAt,
      status: round.status,
      nonce: round.nonce,
      commitHex: round.commitHex,
      rows: round.rows,
    };

    // Include client seed and game data if started
    if (round.status === 'STARTED' || round.status === 'REVEALED') {
      response.clientSeed = round.clientSeed;
      response.dropColumn = round.dropColumn;
      response.binIndex = round.binIndex;
      response.payoutMultiplier = round.payoutMultiplier;
      response.betCents = round.betCents;
      response.payout = round.betCents * round.payoutMultiplier;
      response.pegMapHash = round.pegMapHash;
      response.path = round.pathJson;
    }

    // Only reveal server seed if status is REVEALED
    if (round.status === 'REVEALED') {
      response.serverSeed = round.serverSeed;
      response.combinedSeed = round.combinedSeed;
      response.revealedAt = round.revealedAt;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching round:', error);
    return NextResponse.json(
      { error: 'Failed to fetch round' },
      { status: 500 }
    );
  }
}
