/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Lexend Deca"', 'system-ui', '-apple-system', 'sans-serif'],
        quicksand: ['"Quicksand"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        pitch: {
          950: '#0E0F0E',
          900: '#141513',
          800: '#161616',
          700: '#242224',
          600: '#2D2D2D',
        },
        lime: {
          DEFAULT: '#C8F558',
          400: '#D4F87A',
          500: '#C8F558',
          600: '#7C9A32',
        },
        teal: {
          DEFAULT: '#1AACA6',
        }
      },
      boxShadow: {
        'dock': '0 16px 40px -6px rgba(0, 0, 0, 0.85)',
        'card': '0 8px 24px -6px rgba(0, 0, 0, 0.55)',
      }
    },
  },
  plugins: [],
}
