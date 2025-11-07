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
import { useReducedMotion } from '@/lib/useReducedMotion';

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
  const [binPulse, setBinPulse] = useState(0); // Pulse animation value (0-1)
  const prefersReducedMotion = useReducedMotion();
  
  // Easter Eggs
  const [tiltMode, setTiltMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

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

  // Easter Egg: Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        setTiltMode(prev => !prev);
        console.log('🎮 TILT MODE:', !tiltMode ? 'ACTIVATED' : 'DEACTIVATED');
      } else if (e.key === 'g' || e.key === 'G') {
        setDebugMode(prev => !prev);
        console.log('🔍 DEBUG MODE:', !debugMode ? 'ACTIVATED' : 'DEACTIVATED');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [tiltMode, debugMode]);

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

    // Highlight landing bin if provided with pulse effect
    if (binIndex !== undefined) {
      const x = binIndex * binWidth;
      const color = getBinColor(binIndex);
      
      // Calculate pulse effect (scale and opacity)
      const pulseScale = 1 + binPulse * 0.1; // Grow slightly during pulse
      const pulseOpacity = Math.floor((0.5 + binPulse * 0.3) * 255).toString(16).padStart(2, '0');
      
      ctx.save();
      ctx.translate(x + binWidth / 2, binY + binHeight / 2);
      ctx.scale(pulseScale, pulseScale);
      ctx.translate(-(x + binWidth / 2), -(binY + binHeight / 2));
      
      ctx.fillStyle = color + pulseOpacity;
      ctx.fillRect(x, binY, binWidth - 2, binHeight);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 4 + binPulse * 2; // Thicker border during pulse
      ctx.strokeRect(x, binY, binWidth - 2, binHeight);
      
      ctx.restore();
    }

  }, [dimensions, binIndex, binPulse]);

  // Bin pulse animation when ball lands
  useEffect(() => {
    if (binIndex === undefined || isAnimating) return;

    // Trigger pulse animation
    let animationId: number;
    const duration = 800; // 0.8 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      // Pulse goes 0 -> 1 -> 0
      const pulse = Math.sin(eased * Math.PI);
      
      setBinPulse(pulse);

      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        setBinPulse(0);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [binIndex, isAnimating]);

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
      
      // Debug mode: Draw grid and labels
      if (debugMode) {
        // Draw peg grid overlay
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        for (let row = 0; row < ROWS; row++) {
          const pegCount = row + 3;
          const y = topMargin + (row + 1) * rowSpacing;
          
          // Horizontal line
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
          
          // Row label
          ctx.fillStyle = '#00ff00';
          ctx.font = `${width * 0.012}px monospace`;
          ctx.fillText(`R${row}`, 10, y - 5);
          
          // Peg positions
          for (let peg = 0; peg < pegCount; peg++) {
            const x = width / 2 - (pegCount - 1) * horizontalSpacing / 2 + peg * horizontalSpacing;
            ctx.fillRect(x - 2, y - 2, 4, 4);
            ctx.fillText(`P${peg}`, x - 10, y + 15);
          }
        }
        
        ctx.setLineDash([]);
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

      // Debug mode: Show decision info
      if (debugMode && decision) {
        ctx.fillStyle = '#00ff00';
        ctx.font = `${width * 0.014}px monospace`;
        ctx.fillText(
          `RNG: ${decision.randomValue.toFixed(4)} | Bias: ${decision.adjustedBias.toFixed(4)} | ${decision.decision}`,
          currentX - 80,
          endY - 15
        );
      }

      // Play peg hit sound
      onPegHit?.();

      currentRow++;
      
      if (currentRow < path.length) {
        // Reduce animation time if user prefers reduced motion
        const delay = prefersReducedMotion ? 30 : 100; // Much faster for reduced motion
        timeoutId = setTimeout(() => {
          if (!isCancelled) {
            animationId = requestAnimationFrame(animate);
          }
        }, delay);
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
  }, [path, isAnimating, dimensions, onAnimationComplete, binIndex, onPegHit, prefersReducedMotion, debugMode]);

  return (
    <div 
      className="flex justify-center items-center w-full"
      role="region"
      aria-label="Plinko game board"
    >
      <div className="relative max-w-full">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="border-2 border-gray-700 rounded-lg bg-gradient-to-b from-gray-900 to-gray-800 transition-transform duration-300 max-w-full h-auto"
          style={{
            transform: tiltMode ? `rotate(${Math.random() > 0.5 ? 5 : -5}deg)` : 'rotate(0deg)',
            filter: tiltMode ? 'sepia(0.3) contrast(1.2)' : 'none',
            touchAction: 'none', // Prevent touch gestures from interfering
          }}
          aria-live="polite"
          aria-busy={isAnimating}
          aria-label={isAnimating ? 'Ball is dropping through the board' : 'Ready to drop ball'}
        />
        
        {/* Easter Egg Indicators */}
        {tiltMode && (
          <div 
            className="absolute top-2 left-2 bg-yellow-900/80 text-yellow-200 px-2 sm:px-3 py-1 rounded-full text-xs font-bold animate-pulse"
            role="status"
            aria-live="polite"
          >
            ⚠️ TILT MODE
          </div>
        )}
        
        {debugMode && (
          <div 
            className="absolute top-2 right-2 bg-green-900/80 text-green-200 px-2 sm:px-3 py-1 rounded-full text-xs font-mono"
            role="status"
          >
            🔍 DEBUG
          </div>
        )}
      </div>
    </div>
  );
}
