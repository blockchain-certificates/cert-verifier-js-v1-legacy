import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import replace from 'rollup-plugin-re';

export default {
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist/verifier-node',
      format: 'cjs',
      name: 'Verifier'
    }
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
      mainFields: ['module', 'main'],
      dedupe: ['node-fetch']
    }),
    // fix issue with jsonld
    replace({
      patterns: [
        {
          match: /jsonld.js/,
          test: 'global = window;',
          replace: ''
        },
        {
          match: /jsonld.js/,
          test: 'global = self;',
          replace: ''
        },
        {
          match: /jsonld.js/,
          test: 'global = $;',
          replace: ''
        },
        // fix jsonld|jsonldjs is not defined
        {
          match: /jsonld.js/,
          test: 'if(typeof jsonld === \'undefined\') {',
          replace: 'if(typeof window.jsonld === \'undefined\') {'
        },
        {
          match: /jsonld.js/,
          test: 'jsonld = jsonldjs = factory;',
          replace: 'window.jsonld = window.jsonldjs = factory;'
        },
        {
          test: 'var version = \'\'',
          replace: 'var version = \'11.0.0\''
        }
      ]
    }),
    typescript(),
    commonjs(),
    json()
  ]
};
