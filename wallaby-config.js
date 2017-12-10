module.exports = (wallaby) => ({
  files: [
    'tsconfig.json',
    'package.json',
    'src/**/*.*',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx'
  ],
  tests: [
    'src/**/*.test.ts',
    'src/**/*.test.tsx'
  ],
  env: {
    type: 'node'
  },
  compilers: {
    '**/*.ts?(x)': wallaby.compilers.typeScript({
      module: 'es2015'
    })
  },
  preprocessors: {
    '**/*.js?(x)': file => require('babel-core').transform(
      file.content,
      { sourceMap: true, plugins: ['transform-es2015-modules-commonjs'], presets: ['babel-preset-jest'] })
  },
  testFramework: 'jest',
  debug: true,
  setup (wallaby) {
    var jestConfig = require('./package.json').jest
    // jestConfig.modulePaths[0] = jestConfig.modulePaths[0].replace('<rootDir>', wallaby.projectCacheDir);
    wallaby.testFramework.configure(jestConfig)
  }
})
