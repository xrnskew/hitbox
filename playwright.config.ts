import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// Один набор сквозных проверок — на двух сборках:
// - offline: dist-single/hitbox.html через file://, как его откроют с флешки в классе
//   (перед запуском — npm run build:single; npm run test:e2e делает это сам);
// - pages: обычная сборка в подпапке /hitbox/, как на GitHub Pages
//   (собирает и раздаёт webServer ниже).
const PAGES_PORT = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    // без печати кусков на глазах: иначе каждая кнопка «Добавить» ждёт до секунды; печать — в своём тесте
    contextOptions: { reducedMotion: 'reduce' },
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'offline', use: { baseURL: pathToFileURL(resolve('dist-single/hitbox.html')).href } },
    { name: 'pages', use: { baseURL: `http://localhost:${PAGES_PORT}/hitbox/` } },
  ],
  webServer: {
    command: `npx vite build --outDir dist-pages && npx vite preview --outDir dist-pages --port ${PAGES_PORT} --strictPort`,
    env: { BASE_PATH: '/hitbox/' },
    url: `http://localhost:${PAGES_PORT}/hitbox/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
