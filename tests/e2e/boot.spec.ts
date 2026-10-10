import { expect, test } from '@playwright/test'
import { app, waitGame } from './helpers.ts'

// Загрузка: меню не тянет редактор, игра — отдельный кусок сборки (src/app/game.tsx).
// Пока он грузится — экран загрузки из index.html; не загрузился — понятная ошибка и «Обновить страницу».

/** Кусок игры: game-<хеш>.js в /hitbox/assets/. */
const GAME_CHUNK = /\/assets\/game-[\w-]+\.js$/

test('меню открывается без куска игры, а потом подгружает его заранее', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  const chunks: string[] = []
  page.on('request', (r) => {
    if (GAME_CHUNK.test(r.url())) chunks.push(r.url())
  })
  // кусок игры задержан: меню всё равно рисуется
  let release = () => {}
  const held = new Promise<void>((r) => (release = r))
  await page.route(GAME_CHUNK, async (route) => {
    await held
    await route.continue()
  })
  await page.goto(app())
  await expect(page.getByRole('heading', { name: 'Корзинка' })).toBeVisible()
  await expect(page.getByRole('status')).toHaveCount(0)
  await expect(page.locator('.cm-editor')).toHaveCount(0)
  // браузер свободен — меню само просит кусок игры
  await expect.poll(() => chunks.length).toBeGreaterThan(0)
  release()
  expect(errors).toEqual([])
})

test('игра грузится — экран загрузки, потом редактор и игра', async ({ page }) => {
  let release = () => {}
  const held = new Promise<void>((r) => (release = r))
  await page.route(GAME_CHUNK, async (route) => {
    await held
    await route.continue()
  })
  await page.goto(app() + '?game=catch')
  const boot = page.getByRole('status')
  await expect(boot).toHaveText('Загружаем игру…')
  // появляется не сразу, а через 0.3 с: на быстрой загрузке его не видно
  await expect(boot).toHaveCSS('opacity', '1')
  await expect(page.locator('.boot-road i')).toHaveCount(8)
  release()
  await expect(page.locator('.cm-editor')).toHaveCount(1)
  await waitGame(page)
  await expect(page.locator('.boot')).toHaveCount(0)
})

test('игра не загрузилась — ошибка и кнопка «Обновить страницу»', async ({ page }) => {
  await page.route(GAME_CHUNK, (route) => route.abort())
  await page.goto(app() + '?game=bird')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Игра не загрузилась. Проверь интернет и обнови страницу.')
  await page.unroute(GAME_CHUNK)
  await alert.getByRole('button', { name: 'Обновить страницу' }).click()
  await expect(page.locator('.cm-editor')).toHaveCount(1)
  await expect(page).toHaveTitle('HitBox — Птичка')
})

test('на телефоне экран загрузки помещается без прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 })
  await page.route(GAME_CHUNK, () => new Promise(() => {}))
  await page.goto(app() + '?game=space')
  await expect(page.getByRole('status')).toHaveText('Загружаем игру…')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await page.screenshot({ path: 'test-results/shots/boot-375.png' })
})
