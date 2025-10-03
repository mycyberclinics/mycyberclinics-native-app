module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' },
      modules: 'commonjs'
    }]
  ],
  plugins: ['add-module-exports', '@babel/plugin-transform-runtime'],
  sourceMaps: true,
  retainLines: true
}
