const js = require('@eslint/js')
const { FlatCompat } = require('@eslint/eslintrc')
const path = require('path')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname,
})

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/build/**',
      '**/dist/**',
      '**/*.config.js',
      'apps/web/next-env.d.ts',
      'apps/web/public/sw.js',
      'apps/web/public/**',
      'apps/web/scripts/**',
      'apps/web/check-*.js',
      'apps/web/test-*.js',
      'apps/web/verify-data-integrity.js',
      'apps/web/generate-encryption-key.js',
    ],
  },
  js.configs.recommended,
  ...compat.extends('next/core-web-vitals', 'plugin:@typescript-eslint/recommended'),
  {
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      ecmaVersion: 2021,
      sourceType: 'module',
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      'no-debugger': 'error',
      'react/no-unescaped-entities': 'warn',
      'no-case-declarations': 'warn',
      'no-useless-escape': 'warn',
      'no-constant-condition': 'warn',
    },
  },
  // Legacy Node scripts: allow require/console for quick utilities
  {
    files: ['apps/web/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
]
