/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(128px)' },
          '100%': { transform: 'translateY(0)' },
        }
      },
      animation: {
        scan: 'scan 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
