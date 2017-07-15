import builtins from 'rollup-plugin-node-builtins';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import sass from 'rollup-plugin-sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const isProduction = process.env.NODE_ENV === 'PROD';

export default {
  entry: 'src/js/main.js',
  dest: 'build/main.min.js',
  format: 'iife',
  sourceMap: 'inline',
  onwarn: warning => {
    // Skip certain warnings

    // should intercept ... but doesn't in some rollup versions
    if (warning.code === 'THIS_IS_UNDEFINED') {
      return;
    }

    // console.warn everything else
    console.warn(warning.message);
  },
  plugins: [
    !isProduction &&
      serve({ contentBase: 'build', host: 'localhost', port: 3000 }),
    !isProduction && livereload({ watch: 'build', port: 3001 }),
    sass({
      output: 'styles.min.css',
      processor: css =>
        postcss([autoprefixer, cssnano]).process(css).then(result => result.css)
    }),
    builtins(),
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
    eslint({
      exclude: ['src/scss/**']
    }),
    babel({
      exclude: 'node_modules/**'
    }),
    replace({
      exclude: 'node_modules/**',
      ENV: JSON.stringify(isProduction || 'DEV')
    }),
    isProduction && uglify()
  ]
};
