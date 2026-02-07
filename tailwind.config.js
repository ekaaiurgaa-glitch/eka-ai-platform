/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Claude Dark Theme Palette
        background: '#191919', 
        surface: '#252525',
        border: '#333333',
        input: '#2b2b2b',
        
        // EKA-AI Brand
        brand: {
          orange: '#f18a22',
          hover: '#d97b1f',
          purple: '#5B2C6F',
          green: '#28B463',
        },
        
        // Text
        text: {
          primary: '#ECECEC',
          secondary: '#A1A1A1',
          muted: '#666666'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
