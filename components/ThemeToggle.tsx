/**
 * Theme Toggle Button Component
 * 
 * Cycles through dark and neon themes.
 */

'use client';

import { useTheme } from '@/lib/ThemeContext';

export default function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return '🌙';
      case 'neon':
        return '⚡';
      default:
        return '🌙';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all touch-manipulation"
      style={{
        minWidth: '44px',
        minHeight: '44px',
        backgroundColor: 'var(--background-tertiary)',
        color: 'var(--foreground)',
      }}
      aria-label="Switch theme"
      title="Switch theme"
      suppressHydrationWarning
    >
      <span className="text-base" suppressHydrationWarning>
        {getThemeIcon()}
      </span>
      <span className="ml-2 text-xs hidden sm:inline" suppressHydrationWarning>
        {theme}
      </span>
    </button>
  );
}
