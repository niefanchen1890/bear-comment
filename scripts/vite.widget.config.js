import path from 'path'

module.exports = {
  root: 'widget',
  build: {
    lib: {
      entry: path.resolve(__dirname, '..', 'widget', 'index.js'),
      name: 'cusdis',
      fileName: (format) => format === 'es' ? 'cusdis.es.js' : 'cusdis.umd.js',
    },
    outDir: path.resolve(__dirname, '..', 'public', 'js'),
    emptyOutDir: false,
  },
  plugins: [
    require('rollup-plugin-svelte')({
      emitCss: false,
    }),
  ],
}
