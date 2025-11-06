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
}

const ROWS = 12;
const BINS = 13;

export default function PlinkoBoard({
  path,
  binIndex,
  onAnimationComplete,
  isAnimating = false,
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
    ctx.fillStyle = '#94a3b8';
    for (let row = 0; row < ROWS; row++) {
      const pegCount = row + 1;
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
    if (!path || !isAnimating) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const ballRadius = width * 0.012;
    const topMargin = height * 0.05;
    const binHeight = height * 0.08;
    const bottomMargin = binHeight + 20;
    const boardHeight = height - topMargin - bottomMargin;
    const rowSpacing = boardHeight / (ROWS + 1);
    const horizontalSpacing = width / (BINS + 1);

    let currentRow = 0;
    let currentPos = 0;
    let animationId: number;

    const animate = () => {
      if (currentRow >= path.length) {
        onAnimationComplete?.();
        return;
      }

      const decision = path[currentRow];
      
      // Calculate target position
      if (decision.decision === 'RIGHT') {
        currentPos++;
      }

      const endY = topMargin + (currentRow + 1) * rowSpacing;
      
      // Calculate X position based on current path
      const pegCount = currentRow + 1;
      const rowStartX = width / 2 - (pegCount - 1) * horizontalSpacing / 2;
      const currentX = rowStartX + currentPos * horizontalSpacing;

      // Clear and redraw (simplified - in production would optimize)
      // For now, just draw ball
      ctx.fillStyle = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fbbf24';
      ctx.beginPath();
      ctx.arc(currentX, endY, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      currentRow++;
      
      if (currentRow < path.length) {
        setTimeout(() => {
          animationId = requestAnimationFrame(animate);
        }, 100); // 100ms per row
      } else {
        onAnimationComplete?.();
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [path, isAnimating, dimensions, onAnimationComplete]);

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
