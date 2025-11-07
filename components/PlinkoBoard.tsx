/**
 * Plinko Board Component
 * 
 * Renders the Plinko board with pegs and bins using HTML Canvas.
 * Handles ball animation following the deterministic path.
 */

'use client';

import { useRef, useEffect, useState } from 'react';
import { PathDecision } from '@/lib/plinko-engine';
import { getBinColor } from '@/lib/payout';

interface PlinkoBoard {
  path?: PathDecision[];
  binIndex?: number;
  onAnimationComplete?: () => void;
  isAnimating?: boolean;
  onPegHit?: () => void; // Callback for peg collision sound
}

const ROWS = 12;
const BINS = 13;

export default function PlinkoBoard({
  path,
  binIndex,
  onAnimationComplete,
  isAnimating = false,
  onPegHit,
}: PlinkoBoard) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 900 });

  // Responsive canvas sizing
  useEffect(() => {
    const updateDimensions = () => {
      const width = Math.min(window.innerWidth - 40, 800);
      const height = width * 1.125; // Maintain aspect ratio
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Draw static board
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const pegRadius = width * 0.006;
    const binHeight = height * 0.08;
    const topMargin = height * 0.05;
    const bottomMargin = binHeight + 20;
    const boardHeight = height - topMargin - bottomMargin;
    const rowSpacing = boardHeight / (ROWS + 1);
    const horizontalSpacing = width / (BINS + 1);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw pegs
    // First row has 3 pegs, each subsequent row adds 1 peg
    ctx.fillStyle = '#94a3b8';
    for (let row = 0; row < ROWS; row++) {
      const pegCount = row + 3; // Start with 3 pegs in first row
      const y = topMargin + (row + 1) * rowSpacing;
      
      for (let peg = 0; peg < pegCount; peg++) {
        const x = width / 2 - (pegCount - 1) * horizontalSpacing / 2 + peg * horizontalSpacing;
        
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw bins
    const binY = height - binHeight;
    const binWidth = width / BINS;

    for (let i = 0; i < BINS; i++) {
      const x = i * binWidth;
      const color = getBinColor(i);
      
      ctx.fillStyle = color + '40'; // Semi-transparent
      ctx.fillRect(x, binY, binWidth - 2, binHeight);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, binY, binWidth - 2, binHeight);
      
      // Bin number
      ctx.fillStyle = '#fff';
      ctx.font = `${width * 0.015}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(i.toString(), x + binWidth / 2, binY + binHeight / 2);
    }

    // Highlight landing bin if provided
    if (binIndex !== undefined) {
      const x = binIndex * binWidth;
      const color = getBinColor(binIndex);
      
      ctx.fillStyle = color + '80';
      ctx.fillRect(x, binY, binWidth - 2, binHeight);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, binY, binWidth - 2, binHeight);
    }

  }, [dimensions, binIndex]);

  // Animate ball following path
  useEffect(() => {
    if (!path || !isAnimating) {
      console.log('⏸️ Animation skipped - path or isAnimating is false');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    console.log('🚀 New animation starting - previous should be cleaned up');

    const { width, height } = dimensions;
    const ballRadius = width * 0.012;
    const pegRadius = width * 0.006;
    const topMargin = height * 0.05;
    const binHeight = height * 0.08;
    const bottomMargin = binHeight + 20;
    const boardHeight = height - topMargin - bottomMargin;
    const rowSpacing = boardHeight / (ROWS + 1);
    const horizontalSpacing = width / (BINS + 1);

    let currentRow = 0;
    let currentPos = 1; // Track which gap the ball is in (0 = leftmost gap)
    let animationId: number;
    let timeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false; // Flag to prevent animation after cleanup

    // Initial logging
    console.log('🎮 Starting Animation:', {
      totalRows: path.length,
      expectedBinIndex: binIndex,
      startingPosition: currentPos,
      canvasDimensions: { width, height },
      rowSpacing,
      horizontalSpacing,
    });
    console.log('📍 Full Path:', path.map(p => `Row ${p.row}: ${p.decision}`).join(' → '));

    // Helper function to redraw the entire board
    const redrawBoard = () => {
      // Clear entire canvas
      ctx.clearRect(0, 0, width, height);

      // Redraw pegs
      ctx.fillStyle = '#94a3b8';
      for (let row = 0; row < ROWS; row++) {
        const pegCount = row + 3;
        const y = topMargin + (row + 1) * rowSpacing;
        
        for (let peg = 0; peg < pegCount; peg++) {
          const x = width / 2 - (pegCount - 1) * horizontalSpacing / 2 + peg * horizontalSpacing;
          ctx.beginPath();
          ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Redraw bins
      const binY = height - binHeight;
      const binWidth = width / BINS;

      for (let i = 0; i < BINS; i++) {
        const x = i * binWidth;
        const color = getBinColor(i);
        
        ctx.fillStyle = color + '40';
        ctx.fillRect(x, binY, binWidth - 2, binHeight);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, binY, binWidth - 2, binHeight);
        
        ctx.fillStyle = '#fff';
        ctx.font = `${width * 0.015}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), x + binWidth / 2, binY + binHeight / 2);
      }

      // Highlight landing bin if we know it
      if (binIndex !== undefined) {
        const x = binIndex * binWidth;
        const color = getBinColor(binIndex);
        
        ctx.fillStyle = color + '80';
        ctx.fillRect(x, binY, binWidth - 2, binHeight);
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(x, binY, binWidth - 2, binHeight);
      }
    };

    const animate = () => {
      // Check if animation was cancelled
      if (isCancelled) {
        console.log('🛑 Animation cancelled');
        return;
      }

      if (currentRow >= path.length) {
        console.log('🎯 Animation Complete! Final position:', currentPos);
        onAnimationComplete?.();
        return;
      }

      const decision = path[currentRow];
      const posBeforeMove = currentPos;
      
      // Calculate target position (gap number after this row)
      if (decision.decision === 'RIGHT') {
        currentPos++;
      }
      // If LEFT, currentPos stays the same (same gap)

      const endY = topMargin + (currentRow + 1) * rowSpacing;
      
      // Calculate X position: ball travels in GAPS between pegs
      // For row with pegCount pegs (starting with 3), there are pegCount+1 gaps
      const pegCount = currentRow + 3; // Visual peg count (3, 4, 5, ...)
      const gapCount = pegCount + 1; // Number of gaps between/around pegs
      
      // Center the gaps around the board center
      const totalGapWidth = (gapCount - 1) * horizontalSpacing;
      const firstGapX = width / 2 - totalGapWidth / 2;
      const currentX = firstGapX + currentPos * horizontalSpacing;

      // Debug logging
      console.log(`🏐 Row ${currentRow}:`, {
        decision: decision.decision,
        positionBefore: posBeforeMove,
        positionAfter: currentPos,
        pegCount,
        gapCount,
        xPosition: currentX.toFixed(2),
        yPosition: endY.toFixed(2),
        firstGapX: firstGapX.toFixed(2),
        totalGapWidth: totalGapWidth.toFixed(2),
      });

      // Clear canvas and redraw everything
      redrawBoard();

      // Draw the ball at current position
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.arc(currentX, endY, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Play peg hit sound
      onPegHit?.();

      currentRow++;
      
      if (currentRow < path.length) {
        timeoutId = setTimeout(() => {
          if (!isCancelled) {
            animationId = requestAnimationFrame(animate);
          }
        }, 150); // 100ms per row
      } else {
        onAnimationComplete?.();
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      console.log('🧹 Cleanup: Cancelling animation');
      isCancelled = true;
      
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [path, isAnimating, dimensions, onAnimationComplete, binIndex, onPegHit]);

  return (
    <div className="flex justify-center items-center w-full">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="border-2 border-gray-700 rounded-lg bg-gradient-to-b from-gray-900 to-gray-800"
      />
    </div>
  );
}
