/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { renameSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Две сборки:
// - `npm run build` → dist/ — обычный сайт для GitHub Pages. Адрес, где он живёт, задаёт BASE_PATH:
//   на github.io это '/<репозиторий>/', на своём домене и локально — '/'.
// - `npm run build:single` (режим single) → dist-single/hitbox.html — один файл со всем
//   внутри (JS, CSS, шрифты): открывается двойным кликом с флешки, без интернета и сервера.
export default defineConfig(({ mode }) => {
  const single = mode === 'single'
  return {
    base: single ? './' : (process.env.BASE_PATH ?? '/'),
    plugins: [react(), single && viteSingleFile({ removeViteModuleLoader: true }), single && renameHtml('hitbox.html')],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2022',
      // редактор (CodeMirror), разбор кода (acorn) и React — около 900 кБ, всё нужно сразу
      chunkSizeWarningLimit: 1000,
      ...(single && { outDir: 'dist-single', assetsInlineLimit: Number.MAX_SAFE_INTEGER }),
    },
    test: {
      include: ['tests/unit/**/*.test.ts'],
    },
  }
})

/** Vite называет страницу по входу (index.html); файлу-одиночке нужно своё имя. */
function renameHtml(name: string): Plugin {
  let outDir = ''
  return {
    name: 'timebox:rename-html',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      renameSync(resolve(outDir, 'index.html'), resolve(outDir, name))
    },
  }
}
