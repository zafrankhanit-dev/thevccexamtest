/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf2f2',
          100: '#fbe4e4',
          200: '#f6c6c6',
          300: '#eea0a0',
          400: '#e26f6f',
          500: '#cf3a3a',
          600: '#b81f1f',
          700: '#93171a', // primary
          800: '#7a151a',
          900: '#66151a',
          950: '#380a0d',
        },
        gold: {
          50: '#fdf9ed',
          100: '#faf0d1',
          200: '#f3dd9d',
          300: '#e9c261',
          400: '#dfa938',
          500: '#c98f27',
          600: '#a8721f',
          700: '#86591c',
        },
        ink: {
          50: '#f6f7f8',
          100: '#eceef0',
          200: '#d5d9de',
          300: '#b1b9c2',
          400: '#8691a0',
          500: '#667284',
          600: '#525c6c',
          700: '#434b58',
          800: '#3a404a',
          900: '#22262c',
          950: '#15171b',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(21, 23, 27, 0.06), 0 1px 6px -1px rgba(21, 23, 27, 0.08)',
        popover: '0 8px 30px -6px rgba(21, 23, 27, 0.25)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
};
