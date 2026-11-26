import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.config({
    extends: ['next/core-web-vitals'],
  }),
  {
    ignores: ['node_modules/**', '.next/**', '.next-*/**', 'out/**', 'next-env.d.ts', '.claude/**', 'test-results/**', 'playwright-report/**'],
  },
]

export default eslintConfig
