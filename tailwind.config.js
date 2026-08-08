/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand — warm brown
        brand: {
          50:  '#fdf8f4',
          100: '#f7ede1',
          200: '#edd9be',
          300: '#debb91',
          400: '#cb9a64',
          500: '#b87d43',
          600: '#9a6334',
          700: '#7d4e29',
          800: '#623c1f',
          900: '#4a2c16',
          950: '#2e1a0d',
        },
        // Warm neutrals — beige/cream tones
        warm: {
          50:  '#fefcf9',
          100: '#faf5ee',
          200: '#f4e9d6',
          300: '#ead7b8',
          400: '#dcc09a',
          500: '#c9a47a',
          600: '#b08a60',
          700: '#8f6e48',
          800: '#6e5437',
          900: '#4e3c27',
          950: '#2e2215',
        },
        // Stone/sand neutrals
        sand: {
          50:  '#fdfcf9',
          100: '#f8f4ed',
          200: '#f0e8d8',
          300: '#e4d5bc',
          400: '#d3bc99',
          500: '#bfa07a',
          600: '#a6855e',
          700: '#876947',
          800: '#674f34',
          900: '#4a3825',
          950: '#2a2014',
        },
        // Accent — muted terracotta/rust for warnings
        rust: {
          50:  '#fdf5f2',
          100: '#fbe8e1',
          200: '#f7cfc1',
          300: '#f0ac97',
          400: '#e68068',
          500: '#d85c3e',
          600: '#c04531',
          700: '#9e3528',
          800: '#7c2a20',
          900: '#5c2019',
        },
        // Success — sage green
        sage: {
          50:  '#f4f7f2',
          100: '#e5ede1',
          200: '#ccdac5',
          300: '#aabfa1',
          400: '#839f79',
          500: '#6a875f',
          600: '#556d4c',
          700: '#43563c',
          800: '#354430',
          900: '#2b3827',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'warm-sm': '0 2px 8px 0 rgba(120, 80, 40, 0.08)',
        'warm':    '0 4px 16px 0 rgba(120, 80, 40, 0.12)',
        'warm-lg': '0 8px 32px 0 rgba(120, 80, 40, 0.16)',
        'warm-xl': '0 16px 48px 0 rgba(120, 80, 40, 0.20)',
        'glass':   '0 8px 32px 0 rgba(120, 80, 40, 0.10)',
        'inner-warm': 'inset 0 2px 8px 0 rgba(120, 80, 40, 0.08)',
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #faf5ee 0%, #f4e9d6 50%, #ead7b8 100%)',
        'brown-gradient': 'linear-gradient(135deg, #b87d43 0%, #7d4e29 100%)',
        'hero-gradient': 'linear-gradient(135deg, #fefcf9 0%, #f7ede1 40%, #ead7b8 100%)',
      },
      borderRadius: {
        'xl2': '1.25rem',
      }
    },
  },
  plugins: [],
}
