/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.html"],
  theme: {
    extend: {
      colors: {
        navy: '#1B2A4A',
        champagne: '#D4C5A9',
        sage: '#7A9E7E',
        cream: '#F7F5F0',
        charcoal: '#2D2D2D',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
