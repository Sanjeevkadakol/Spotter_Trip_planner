/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#17191c',
        paper: '#ffffff',
        mist: '#f2f2f3',
        fog: '#fafafb',
        slate: {
          gray: '#777b86',
        },
        ash: '#979799',
        smoke: '#a3a6af',
        peach: {
          DEFAULT: '#fbe1d1',
          light: '#fdf0e8',
        },
        sienna: '#5d2a1a',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'ui-serif', 'serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '2xl-2': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'artifact': '0 0 0 1px rgba(4,23,43,0.05), 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.06)',
        'subtle': '0 0 0 1px rgba(0,0,0,0.05), 0 4px 24px 0 rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
}

