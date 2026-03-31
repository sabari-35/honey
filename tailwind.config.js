/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          primary: '#D4AF37',
          light: '#F5D060',
          glow: 'rgba(212, 175, 55, 0.15)',
        },
        obsidian: '#1A1A1E',
        surface: {
          1: '#1A1A1E',
          2: '#1A1A1E',
          3: '#1A1A1E',
        },
        glass: {
          DEFAULT: 'transparent',
          border: 'rgba(255,255,255,0.01)',
        },
        text: {
          primary: '#E8E8E8',
          secondary: '#9CA3AF',
          muted: '#6B7280',
        },
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
