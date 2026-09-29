import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

// Flat config for the renderer (src/), the CLI and the repository scripts/tests.
// Generated outputs are ignored: `packages/*/template` is produced from `src/`
// by `npm run sync`, `packages/*/packaged-skill` is prepack-only, and `dist/` /
// `tmp/` are build/scratch. Linting them would report drift that the next sync
// overwrites.
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'tmp/**',
      'content/**',
      'index.html',
      'scroll.html',
      'packages/**/template/**',
      'packages/**/packaged-skill/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        // Build-time constants injected by Vite `define` (see vite.config.js and
        // the CLI's --skin / --default-mode / --style flags).
        __ATLAS_DEFAULT_SKIN__: 'readonly',
        __ATLAS_DEFAULT_MODE__: 'readonly',
        __ATLAS_DEFAULT_STYLE__: 'readonly'
      }
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // Props are documented by the MDX reference, not PropTypes.
      'react/prop-types': 'off',
      // The stable, universally applicable hooks rules. The React Compiler
      // heuristics that ship in react-hooks v7 (refs / immutability /
      // set-state-in-effect) flag deliberate, commented patterns here (e.g. the
      // latest-value refs that popstate handlers read synchronously); adopting
      // them is a separate refactor, not a lint-config change.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['*.js', 'scripts/**/*.mjs', 'test/**/*.mjs', 'packages/**/bin/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  },
  prettier
];
