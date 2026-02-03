/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        quilmes: '#FFD700',
        brahma: '#CC0000',
        mantel: {
          light: '#E8E4D9',
          dark: '#2D2D2D',
          check: '#D4CFC4'
        }
      },
      fontFamily: {
        handwriting: ['Caveat', 'cursive'],
      },
      animation: {
        'bounce-in': 'bounceIn 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        }
      }
    },
  },
  plugins: [],
}
