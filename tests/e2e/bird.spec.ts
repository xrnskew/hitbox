import { expect, type Page, test } from '@playwright/test'
import { addPieces, app, game, open, openQuest, pick, run, tab, waitGame } from './helpers.ts'

// Птичка: вторая игра конструктора. Всё то же ядро, что у Корзинки, — проверяем, что урок собирается
// квестами от начала до конца и что у приставки своя кнопка «Взмах».

/** Кнопка «Взмах» на корпусе: шлёт в игру пробел, как палец на планшете. */
async function flapButton(page: Page) {
  const flap = page.getByRole('button', { name: 'Взмах', exact: true })
  await flap.dispatchEvent('pointerdown')
  await flap.dispatchEvent('pointerup')
}

const progress = (page: Page) => page.getByRole('navigation', { name: 'Прогресс' })

test('Птичка в меню: своя карточка, открывается по ?game=bird', async ({ page }) => {
  await page.goto(app())
  const card = page.getByRole('article', { name: 'Птичка' })
  await expect(card).toContainText('Легко')
  await expect(card).toContainText('Ещё не начата')
  await card.getByRole('link', { name: 'Начать Птичка' }).click()
  await expect(page).toHaveURL(/\?game=bird$/)
  await waitGame(page)
  await expect(page).toHaveTitle('HitBox — Птичка')
  await expect(page.getByRole('heading', { level: 1, name: 'Птичка' })).toBeVisible()
  for (const title of ['Гайд', 'Движок', 'Птица', 'Взмах', 'Трубы', 'Удар'])
    await expect(page.getByRole('tab', { name: new RegExp(title) })).toBeVisible()
})

test('Птичка: вся игра по квестам, взмах, удар и счёт, монетки и скорость', async ({ page }) => {
  const errors = await open(page, '?game=bird')
  await expect(progress(page)).toContainText('0/6')

  // шаг 1: птица
  await openQuest(page, 1, 'Открыть «Птица»')
  await addPieces(page, 1)
  await page.locator('.cm-pick').first().click()
  await pick(page, 'сова')
  await addPieces(page, 2)
  await run(page)
  expect(await game(page, 'birdPic')).toBe('сова')
  await openQuest(page, 1, 'Открыть «Птица»', 'Птица падает')
  await addPieces(page, 4)
  await openQuest(page, 1, 'Открыть «Движок»', 'Включи гравитацию')
  await page.keyboard.type('0.4')
  await run(page)

  // до первого взмаха птица висит, после — падает всё быстрее
  await page.waitForTimeout(200)
  expect(await game(page, '[started, birdY]')).toEqual([false, 220])
  await flapButton(page)
  await page.waitForTimeout(300)
  expect(await game(page, 'started')).toBe(true)
  expect(await game<number>(page, 'birdY')).toBeGreaterThan(225)
  expect(await game<number>(page, 'speedY')).toBeGreaterThan(0)

  // шаг 2: взмах
  await openQuest(page, 2, 'Открыть «Взмах»')
  await addPieces(page, 2)
  await openQuest(page, 2, 'Открыть «Движок»', 'Сила взмаха')
  await page.keyboard.type('7')

  // шаг 3: трубы
  await openQuest(page, 3, 'Открыть «Трубы»')
  await addPieces(page, 5 + 4)
  await openQuest(page, 3, 'Открыть «Движок»', 'Скорость труб')
  await page.keyboard.type('2')
  // свой цвет труб — из палитры у pipeColor
  await openQuest(page, 3, 'Выбрать цвет в «Движок»', 'Цвет труб')
  const palette = page.getByRole('dialog', { name: 'Выбери цвет' })
  await expect(palette.getByRole('button', { name: 'зелёный', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await palette.getByRole('button', { name: 'розовый', exact: true }).click()
  await expect(page.locator('.cm-pick .cm-pickSwatch')).toHaveCSS('background-color', 'rgb(236, 64, 122)')

  // шаг 4: удар и очко за трубу
  await openQuest(page, 4, 'Открыть «Удар»')
  await addPieces(page, 5)
  await openQuest(page, 4, 'Открыть «Удар»', 'Очко за трубу')
  await addPieces(page, 1)
  await expect(progress(page)).toContainText('4/6')
  await run(page)

  // взмах с корпуса — скорость вверх
  await flapButton(page)
  expect(await game<number>(page, 'speedY')).toBeLessThan(0)
  expect(await game(page, '[pipeSpeed, pipeColor]')).toEqual([2, '#ec407a'])

  // пролетела трубу — очко; ударилась о низ экрана — «Игра окончена»
  expect(await game(page, 'pipes = [{ x: 20, top: 100, passed: false }]; birdY = 200; checkHit(); score')).toBe(1)
  await game(page, 'birdY = 460; checkHit()')
  const over = page.getByRole('button', { name: 'Начать заново' })
  await expect(over).toBeVisible()
  await expect(page.getByText('Счёт: 1. Рекорд: 1.')).toBeVisible()
  await over.click()
  await waitGame(page)
  expect(await game(page, '[started, gameOver, score]')).toEqual([false, false, 0])

  // «Границы» — про столкновения птицы
  const hitboxes = page.getByRole('switch', { name: 'Границы' })
  await expect(hitboxes).toHaveAttribute('title', /checkHit/)
  await hitboxes.click()
  await expect(hitboxes).toHaveAttribute('aria-checked', 'true')

  // монетки и скорость — после сборки игры, по две кнопки
  await tab(page, 'Гайд')
  await expect(page.getByRole('heading', { name: 'Монетки и скорость' })).toBeVisible()
  const coins = page.locator('#guide-task-5')
  await coins.getByRole('button', { name: 'Добавить переменную в «Движок»' }).click()
  await tab(page, 'Гайд')
  await coins.getByRole('button', { name: 'Вставить код в «Трубы» и «Удар»' }).click()
  await tab(page, 'Гайд')
  const fast = page.locator('#guide-task-6')
  await fast.getByRole('button', { name: 'Добавить переменную в «Движок»' }).click()
  await tab(page, 'Гайд')
  await fast.getByRole('button', { name: 'Вставить код в «Трубы»' }).click()
  await expect(progress(page)).toContainText('6/6')
  await run(page)
  expect(await game(page, '[coinPic, maxSpeed, typeof speedUp]')).toEqual(['монетка', 5, 'function'])
  expect(errors).toEqual([])
})

test('Птичка: готовая версия под паролем', async ({ page }) => {
  await page.goto(`${app()}?game=bird&finished`)
  await expect(page.getByRole('heading', { name: 'Готовая игра под паролем' })).toBeVisible()
  await page.getByLabel('Пароль').fill('000110')
  await page.getByRole('button', { name: 'Открыть' }).click()
  await waitGame(page)
  await expect(page).toHaveTitle('HitBox — готовая игра Птичка')
  await expect(page.getByRole('heading', { name: 'Что тут есть' })).toBeVisible()
  expect(await game(page, '[gravity, flapPower, pipeSpeed, birdPic]')).toEqual([0.4, 7, 2, 'птичка'])
  await flapButton(page)
  expect(await game(page, 'started')).toBe(true)
  expect(await game<number>(page, 'speedY')).toBeLessThan(0)
})
