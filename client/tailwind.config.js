/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: {
            DEFAULT: '#0038A8', // Primary government blue
            dark: '#002B80',    // Darker government blue
            light: '#E6EEFF',   // Very light blue tint
            accent: '#0E59F2',  // Accent bright blue
          },
          gold: {
            DEFAULT: '#FFC72C', // CHED gold
            dark: '#D99B00',
            light: '#FEF9E7',
          },
          red: {
            DEFAULT: '#D22630', // Accent red
            light: '#FCE8E9',
          },
        },
        sidebar: '#0B192C',     // Dark slate sidebar
        dashboard: {
          bg: '#F8FAFC',        // Slate-50 background
          border: '#E2E8F0',    // Slate-200 border
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
