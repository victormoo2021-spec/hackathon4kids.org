import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals'],
  }),
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/app/motion/kit.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [{ group: ['gsap', 'gsap/*'], allowTypeImports: true, message: 'gsap is imported only in src/app/motion/kit.ts' }] }] },
  },
  {
    ignores: ['node_modules/**', '.next/**', '.next-*/**', 'out/**', 'next-env.d.ts', '.claude/**', 'test-results/**', 'playwright-report/**'],
  },
]

export default eslintConfig
