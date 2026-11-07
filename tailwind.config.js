/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Lilita One"', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#fff6e0',
        night: '#14204a',
      },
      keyframes: {
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 3px rgba(250,204,21,.9), 0 0 18px 6px rgba(250,204,21,.6)' },
          '50%': { boxShadow: '0 0 0 3px rgba(250,204,21,.4), 0 0 6px 2px rgba(250,204,21,.2)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      animation: {
        pulseGlow: 'pulseGlow 1s ease-in-out infinite',
        shake: 'shake .25s ease-in-out 2',
      },
    },
  },
  plugins: [],
};
