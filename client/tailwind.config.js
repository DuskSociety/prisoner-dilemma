/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cooperate: { DEFAULT: '#FF6B35', light: '#FF8C5A', dark: '#E55A2B', glow: 'rgba(255,107,53,0.30)' },
        betray:    { DEFAULT: '#E83F6F', light: '#F06292', dark: '#C62850', glow: 'rgba(232,63,111,0.30)' },
        wild:      { DEFAULT: '#45B7D1', light: '#67D5E8', dark: '#2E9AB5', glow: 'rgba(69,183,209,0.30)' },
        spectate:  { DEFAULT: '#A855F7', light: '#C084FC', dark: '#7C3AED', glow: 'rgba(168,85,247,0.25)' },
        surface:   { DEFAULT: '#F5F0FF', alt: '#FFF0F5' },
        text:      { primary: '#1E1E2E', secondary: '#6B6B80', muted: '#9E9EB0' },
      },
      fontFamily: {
        display: ['Fredoka', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['Space Grotesk', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
