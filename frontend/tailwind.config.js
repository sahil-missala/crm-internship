/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A3C5E', // deep navy
          light: '#23517F',
          dark: '#11283F',
        },
        accent: {
          DEFAULT: '#F59E0B', // amber
          light: '#FBBF24',
          dark: '#D97706',
        },
        success: '#10B981',
        danger: '#EF4444',
        surfaceBg: '#F8FAFC', // portal bg
        surface: '#FFFFFF',   // cards
        borderGray: '#E2E8F0',
        textMain: '#0F172A',
        textMuted: '#64748B'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.08)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      },
      borderRadius: {
        card: '8px',
        input: '6px',
        badge: '4px',
      }
    },
  },
  plugins: [],
}
