/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}","./src/**/*.{js,jsx,ts,tsx}" ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5eb58c',
          dark: '#5eb58c',
        },
        secondary: {
          DEFAULT: '#8B95A3',
          dark: '#8B95A3',
        },
        background: {
          DEFAULT: '#efefef',
          dark: '#232323',
        },
        surface: {
          DEFAULT: '#f9fafb',
          dark: '#303030',
        },
        text: {
          DEFAULT: '#111827',
          dark: '#F3F4F6',
        },
        border: {
          DEFAULT: '#e5e7eb',
          dark: '#374137',
        },
      },
      rotate: {
        '180': '180deg',
      },
      animation: {
        'spin-once': 'spin 2s ease-in-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        spin: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(180deg)' },
        },
        hover: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-16px)' },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .5 },
        },
      }
    },
  },
  plugins: [],
  darkMode: 'class'
}

