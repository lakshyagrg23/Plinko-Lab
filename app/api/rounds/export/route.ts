/**
 * GET /api/rounds/export?limit=100&status=REVEALED
 *
 * Returns a CSV file containing recent rounds. Default: revealed rounds, limit 100.
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

function escapeCsv(value: any) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // If contains quote, comma or newline, wrap in quotes and escape quotes
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const limitStr = url.searchParams.get('limit') || '100';
    const status = url.searchParams.get('status') || 'REVEALED';
    const limit = Math.min(Math.max(parseInt(limitStr, 10) || 100, 1), 1000);

    const where: any = {};
    if (status !== 'ALL') {
      where.status = status;
    }

    const rounds = await prisma.round.findMany({
      where,
      orderBy: { revealedAt: 'desc' },
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

    const headers = [
      'roundId',
      'status',
      'commitHex',
      'nonce',
      'serverSeed',
      'clientSeed',
      'combinedSeed',
      'pegMapHash',
      'rows',
      'dropColumn',
      'binIndex',
      'payoutMultiplier',
      'betCents',
      'createdAt',
      'revealedAt',
    ];

    const rows = [headers.join(',')];

    for (const r of rounds) {
      const row = [
        escapeCsv(r.id),
        escapeCsv(r.status),
        escapeCsv(r.commitHex),
        escapeCsv(r.nonce),
        escapeCsv(r.serverSeed),
        escapeCsv(r.clientSeed),
        escapeCsv(r.combinedSeed),
        escapeCsv(r.pegMapHash),
        escapeCsv(r.rows),
        escapeCsv(r.dropColumn),
        escapeCsv(r.binIndex),
        escapeCsv(r.payoutMultiplier),
        escapeCsv(r.betCents),
        escapeCsv(r.createdAt?.toISOString()),
        escapeCsv(r.revealedAt?.toISOString()),
      ];
      rows.push(row.join(','));
    }

    const csv = rows.join('\n');
    const filename = `plinko_rounds_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Error exporting rounds CSV:', err);
    return new Response('Failed to export rounds', { status: 500 });
  }
}
