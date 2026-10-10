/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// `npm run build` → dist/ — сайт для GitHub Pages. Адрес, где он живёт, задаёт BASE_PATH:
// на github.io это '/<репозиторий>/', на своём домене и локально — '/'.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // редактор (CodeMirror), разбор кода (acorn) и React — около 900 кБ, всё нужно сразу
    chunkSizeWarningLimit: 1000,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
})
