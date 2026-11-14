/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5fa',
          100: '#e1ebf5',
          200: '#c3d7eb',
          300: '#94b9dc',
          400: '#5e94c8',
          500: '#3875b2',
          600: '#275c94',
          700: '#204a77',
          800: '#1d3f63',
          900: '#0F1E36', // deep trustworthy navy
          950: '#0A1324', // midnight navy
        },
        verdict: {
          safe: '#16A34A',
          'safe-bg': '#F0FDF4',
          'safe-border': '#86EFAC',
          suspicious: '#D97706',
          'suspicious-bg': '#FFFBEB',
          'suspicious-border': '#FDE68A',
          scam: '#DC2626',
          'scam-bg': '#FEF2F2',
          'scam-border': '#FECACA',
        }
      },
      fontSize: {
        base: ['1.125rem', { lineHeight: '1.75rem' }], // 18px base
      },
      minHeight: {
        'touch': '48px',
      },
      minWidth: {
        'touch': '48px',
      }
    },
  },
  plugins: [],
}
