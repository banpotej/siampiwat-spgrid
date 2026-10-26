import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist/', 'node_modules/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { ...globals.browser } },
  },
  { files: ['*.config.js'], languageOptions: { globals: { ...globals.node } } },
  { files: ['tests/e2e/**'], languageOptions: { globals: { ...globals.node } } },
  prettier,
];
