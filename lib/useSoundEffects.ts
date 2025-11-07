/**
 * Sound Effects Hook
 * 
 * Manages game sound effects with mute toggle.
 * Uses Web Audio API for better control and performance.
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

export function useSoundEffects() {
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    // Create AudioContext on first user interaction (browser requirement)
    const initAudio = () => {
      if (!audioContextRef.current) {
        const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextConstructor();
      }
    };

    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  /**
   * Play peg collision sound (subtle tick)
   * Using oscillator for simple, synthesized sound
   */
  const playPegSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Short, high-pitched tick
    oscillator.frequency.value = 800 + Math.random() * 200; // Randomize pitch slightly
    oscillator.type = 'sine';

    // Quick fade out
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  }, [isMuted]);

  /**
   * Play landing sound (celebration)
   * Plays different sounds based on win size
   */
  const playLandingSound = useCallback((multiplier: number = 1) => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    
    // Create a chord for celebratory sound
    const frequencies = multiplier >= 5 
      ? [523.25, 659.25, 783.99] // C major chord (big win)
      : [440, 554.37]; // A major (normal win)

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + index * 0.05;
      const duration = 0.3;

      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }, [isMuted]);

  /**
   * Play success fanfare for big wins
   */
  const playWinSound = useCallback(() => {
    if (isMuted || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    
    // Ascending notes for excitement
    const melody = [
      { freq: 523.25, time: 0 },    // C5
      { freq: 659.25, time: 0.1 },  // E5
      { freq: 783.99, time: 0.2 },  // G5
      { freq: 1046.5, time: 0.3 },  // C6
    ];

    melody.forEach(({ freq, time }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'triangle';

      const startTime = ctx.currentTime + time;
      const duration = 0.15;

      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    isMuted,
    toggleMute,
    playPegSound,
    playLandingSound,
    playWinSound,
  };
}
