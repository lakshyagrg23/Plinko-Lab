/**
 * GET /api/verify
 * 
 * Public verifier endpoint that recomputes outcomes from seeds.
 * This allows anyone to verify the fairness of a round.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateCommitHex,
  generateCombinedSeed,
} from '@/lib/fairness';
import { computePlinkoOutcome } from '@/lib/plinko-engine';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serverSeed = searchParams.get('serverSeed');
    const clientSeed = searchParams.get('clientSeed');
    const nonce = searchParams.get('nonce');
    const dropColumnStr = searchParams.get('dropColumn');

    // Validate inputs
    if (!serverSeed || !clientSeed || !nonce || !dropColumnStr) {
      return NextResponse.json(
        {
          error:
            'Missing required parameters: serverSeed, clientSeed, nonce, dropColumn',
        },
        { status: 400 }
      );
    }

    const dropColumn = parseInt(dropColumnStr, 10);
    if (isNaN(dropColumn) || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: 'dropColumn must be a number between 0 and 12' },
        { status: 400 }
      );
    }

    // Recompute all values
    const commitHex = generateCommitHex(serverSeed, nonce);
    const combinedSeed = generateCombinedSeed(serverSeed, clientSeed, nonce);
    const outcome = computePlinkoOutcome(combinedSeed, dropColumn);

    // Return verification data
    return NextResponse.json({
      inputs: {
        serverSeed,
        clientSeed,
        nonce,
        dropColumn,
      },
      computed: {
        commitHex,
        combinedSeed,
        pegMapHash: outcome.pegMapHash,
        binIndex: outcome.binIndex,
        path: outcome.path,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error verifying round:', error);
    return NextResponse.json(
      { error: 'Failed to verify round' },
      { status: 500 }
    );
  }
}
