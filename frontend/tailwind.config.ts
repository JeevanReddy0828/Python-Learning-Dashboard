import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
        },
        xp: '#f6c90e',
        background: {
          light: '#FAFAF9',
          dark: '#1A1A2E',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#242448',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        base: ['16px', { lineHeight: '1.6' }],
      },
      maxWidth: {
        lesson: '680px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease',
        'slide-up': 'slideUp 0.3s ease',
        'slide-right': 'slideRight 0.3s ease',
        'bounce-soft': 'bounceSoft 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'float-up': 'floatUp 1s ease forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        bounceSoft: { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.05)' } },
        floatUp: { from: { opacity: '1', transform: 'translateY(0)' }, to: { opacity: '0', transform: 'translateY(-40px)' } },
      },
    },
  },
  plugins: [],
} satisfies Config
