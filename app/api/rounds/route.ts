/**
 * GET /api/rounds?limit=20
 * 
 * Returns recent rounds for session history/log.
 * Only returns revealed rounds with complete data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitStr = searchParams.get('limit');
    const limit = limitStr ? parseInt(limitStr, 10) : 20;

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be a number between 1 and 100' },
        { status: 400 }
      );
    }

    // Fetch recent revealed rounds
    const rounds = await prisma.round.findMany({
      where: {
        status: 'REVEALED',
      },
      orderBy: {
        revealedAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        commitHex: true,
        nonce: true,
        clientSeed: true,
        serverSeed: true,
        combinedSeed: true,
        pegMapHash: true,
        rows: true,
        dropColumn: true,
        binIndex: true,
        payoutMultiplier: true,
        betCents: true,
        pathJson: true,
        status: true,
        createdAt: true,
        revealedAt: true,
      },
    });

    return NextResponse.json({
      rounds: rounds.map((round) => ({
        roundId: round.id,
        commitHex: round.commitHex,
        nonce: round.nonce,
        clientSeed: round.clientSeed,
        serverSeed: round.serverSeed,
        combinedSeed: round.combinedSeed,
        pegMapHash: round.pegMapHash,
        rows: round.rows,
        dropColumn: round.dropColumn,
        binIndex: round.binIndex,
        payoutMultiplier: round.payoutMultiplier,
        betCents: round.betCents,
        path: round.pathJson,
        status: round.status,
        createdAt: round.createdAt.toISOString(),
        revealedAt: round.revealedAt?.toISOString(),
        // Generate verifier link
        verifyLink: `/verify?serverSeed=${encodeURIComponent(round.serverSeed!)}&clientSeed=${encodeURIComponent(round.clientSeed)}&nonce=${encodeURIComponent(round.nonce)}&dropColumn=${round.dropColumn}`,
      })),
      count: rounds.length,
      limit,
    });
  } catch (error) {
    console.error('Error fetching rounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rounds' },
      { status: 500 }
    );
  }
}
