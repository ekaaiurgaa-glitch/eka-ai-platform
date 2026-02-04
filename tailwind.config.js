/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eka-orange': '#f18a22',
        'eka-green': '#22c55e',
        'eka-bg': '#000000',
        'eka-card': '#0A0A0A',
        'eka-border': '#262626',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'headers': ['Outfit', 'sans-serif'],
        'mono': ['Roboto Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
