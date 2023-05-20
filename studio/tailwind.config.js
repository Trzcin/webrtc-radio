module.exports = {
  content: ['./src/frontend/**/*.svelte'],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      outline: ['focus'],
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
