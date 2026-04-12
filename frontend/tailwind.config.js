/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // University navy palette
        navy: {
          50:  '#e8edf5',
          100: '#c5d1e6',
          200: '#9fb2d3',
          300: '#7993c0',
          400: '#5d7bb2',
          500: '#4163a4',
          600: '#355597',
          700: '#274685',
          800: '#1a3870',
          900: '#0f2552',
          950: '#091a3e',
        },
        // University maroon accent
        maroon: {
          500: '#862633',
          600: '#7c1d2b',
          700: '#6a1525',
        },
        // Gold accent
        gold: {
          400: '#f5c842',
          500: '#e6b800',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
