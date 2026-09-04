import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-cjs/**',
      '**/.next/**',
      '**/next-env.d.ts',
      '**/coverage/**',
      '**/build/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'prototypes/**',
      'apps/mobile/**',
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettier,
);
