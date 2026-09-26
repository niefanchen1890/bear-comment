module.exports = {
  plugins: {
    tailwindcss: {
      content: ['widget/**/*.svelte', 'widget/theme.css'],
      darkMode: 'class',
      variants: {
        extend: {
          outline: ['dark'],
          borderWidth: ['dark'],
          borderColor: ['dark']
        },
      },
    },
    autoprefixer: {},
  },
}
