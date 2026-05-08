/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        navy: '#18253F',
        ink: '#0F1A30',
        champagne: '#C9B086',
        brass: '#A8884E',
        sage: '#5C7A60',
        forest: '#2F4A37',
        cream: '#F4EFE6',
        paper: '#FAF6EE',
        charcoal: '#252420',
        mute: '#6B6760',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'micro': '0.22em',
      },
    },
  },
  plugins: [],
}
