/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF9F6',
          dark: '#F4F2EB',
          warm: '#FFFDF9'
        },
        doodle: {
          black: '#1c1917',
          gray: '#78716c',
          light: '#e7e5e4',
          yellow: '#fef08a',
          coral: '#fecdd3',
          mint: '#d1fae5',
          sky: '#e0f2fe'
        }
      },
      boxShadow: {
        'doodle': '3px 3px 0px 0px #1c1917',
        'doodle-sm': '2px 2px 0px 0px #1c1917',
        'doodle-lg': '5px 5px 0px 0px #1c1917',
        'doodle-hover': '1px 1px 0px 0px #1c1917'
      },
      borderRadius: {
        'doodle': '18px',
        'doodle-lg': '24px'
      },
      fontFamily: {
        sans: ['"Comic Neue"', '"Quicksand"', 'Inter', 'system-ui', 'sans-serif'],
        hand: ['"Patrick Hand"', '"Comic Neue"', 'cursive', 'sans-serif']
      }
    },
  },
  plugins: [],
}
