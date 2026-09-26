/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Map & Ink" travel-journal palette -- not the default cream/terracotta AI look.
        ink: {
          950: '#0F1E1C', // near-black deep teal-ink, used for headers/nav
          900: '#152C29',
          800: '#1F3D38',
          700: '#2C534C',
        },
        paper: {
          50: '#FBF7EE',  // aged map paper
          100: '#F4EEDD',
          200: '#E9DFC4',
        },
        amber: {
          400: '#E0A458', // wax-seal amber accent (route lines, CTAs)
          500: '#C98A3C',
          600: '#A96D28',
        },
        route: '#B0473B', // dotted itinerary route red
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['Poppins', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      backgroundImage: {
        'grain': "radial-gradient(rgba(15,30,28,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grain': '4px 4px',
      },
    },
  },
  plugins: [],
};
