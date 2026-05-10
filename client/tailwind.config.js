/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2E75B6', light: '#5B9BD5', dark: '#1A5A94' },
        accent: { DEFAULT: '#E63946', light: '#F0606D', dark: '#C1121F' },
        surface: { DEFAULT: '#F8FAFC', alt: '#F1F5F9', card: '#FFFFFF' },
        text: { primary: '#1E293B', secondary: '#64748B', muted: '#94A3B8' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
