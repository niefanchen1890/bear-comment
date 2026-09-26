import path from 'path'

module.exports = {
  root: 'widget',
  build: {
    lib: {
      entry: path.resolve(__dirname, '..', 'widget', 'sdk.js'),
      name: 'cusdis',
      fileName: (format) => format === 'es' ? 'cusdis.es.js' : 'cusdis.umd.js',
    },
    outDir: path.resolve(__dirname, '..', 'widget', 'dist'),
    emptyOutDir: false,
  },
  plugins: [
    require('rollup-plugin-svelte')({
      emitCss: false,
    }),
  ],
}
