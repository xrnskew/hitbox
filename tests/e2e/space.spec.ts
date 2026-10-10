import { expect, type Page, test } from '@playwright/test'
import { addPieces, app, game, open, openQuest, pick, run, tab, waitGame } from './helpers.ts'

// Космос: третья игра конструктора, уровень «Сложно». Проверяем, что урок собирается квестами от начала
// до конца — с лучом, перезарядкой, зигзагом и вложенным циклом, — что у приставки ← → и «Огонь», а заодно
// шапку на любой ширине и отпускание зажатых клавиш, когда игра теряет фокус.

const progress = (page: Page) => page.getByRole('navigation', { name: 'Прогресс' })

/**
 * Зажать «Огонь» на корпусе на `frames` кадров игры и посчитать, сколько пуль вылетело.
 * Держим по кадрам, а не по часам: на загруженной машине кадров в секунду меньше, а игра считает кадрами.
 */
async function shotsOverFrames(page: Page, frames: number): Promise<{ shots: number; frames: number }> {
  // считаем каждый push в bullets: пули улетают за край, и длина массива — не то
  await game(
    page,
    'window.__shots = 0; window.__frame0 = frame; var __push = bullets.push; bullets.push = function () { window.__shots++; return __push.apply(this, arguments); }',
  )
  const fire = page.getByRole('button', { name: 'Огонь', exact: true })
  await fire.dispatchEvent('pointerdown')
  await expect.poll(() => game<number>(page, 'frame - __frame0'), { timeout: 15_000 }).toBeGreaterThanOrEqual(frames)
  await fire.dispatchEvent('pointerup')
  return game(page, '({ shots: __shots, frames: frame - __frame0 })')
}

test('Космос в меню: своя карточка, «Сложно», открывается по ?game=space', async ({ page }) => {
  await page.goto(app())
  const card = page.getByRole('article', { name: 'Космос' })
  await expect(card).toContainText('Сложно')
  await expect(card).toContainText('Ещё не начата')
  // игр нечётное число — место для новой стоит рядом с третьей карточкой, а не под ней
  const soon = page.getByLabel('Скоро')
  const [cardBox, soonBox] = [(await card.boundingBox())!, (await soon.boundingBox())!]
  expect(Math.abs(soonBox.y - cardBox.y)).toBeLessThan(2)
  expect(soonBox.x).toBeGreaterThan(cardBox.x + cardBox.width)

  await card.getByRole('link', { name: 'Начать Космос' }).click()
  await expect(page).toHaveURL(/\?game=space$/)
  await waitGame(page)
  await expect(page).toHaveTitle('HitBox — Космос')
  await expect(page.getByRole('heading', { level: 1, name: 'Космос' })).toBeVisible()
  for (const title of ['Гайд', 'Движок', 'Корабль', 'Пули', 'Пришельцы', 'Попадание'])
    await expect(page.getByRole('tab', { name: new RegExp(title) })).toBeVisible()
  for (const name of ['Влево', 'Вправо', 'Огонь'])
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible()
})

test('Космос: вся игра по квестам — луч, перезарядка, зигзаг, попадания, взрывы и волны', async ({ page }) => {
  test.setTimeout(90_000)
  const errors = await open(page, '?game=space')
  await expect(progress(page)).toContainText('0/6')

  // шаг 1: корабль
  await openQuest(page, 1, 'Открыть «Корабль»')
  await addPieces(page, 1)
  await page.locator('.cm-pick').first().click()
  await pick(page, 'тарелка')
  await addPieces(page, 2)
  await run(page)
  expect(await game(page, 'shipPic')).toBe('тарелка')
  await openQuest(page, 1, 'Открыть «Корабль»', 'Научи корабль летать')
  await addPieces(page, 4)
  await openQuest(page, 1, 'Открыть «Движок»', 'Скорость корабля')
  await page.keyboard.type('6')
  await run(page)
  const right = page.getByRole('button', { name: 'Вправо', exact: true })
  await right.dispatchEvent('pointerdown')
  await page.waitForTimeout(300)
  await right.dispatchEvent('pointerup')
  // сдвинулся вправо от 170 — на сколько, зависит от числа кадров
  expect(await game<number>(page, 'shipX')).toBeGreaterThan(170)

  // шаг 2: пули — сначала сплошной луч, потом перезарядка
  await openQuest(page, 2, 'Открыть «Пули»')
  await addPieces(page, 2 + 3 + 3)
  await openQuest(page, 2, 'Открыть «Движок»', 'Скорость пуль')
  await page.keyboard.type('9')
  await run(page)
  // без перезарядки — пуля каждый кадр, пока зажат «Огонь». Часть кадров уходит, пока нажатие дойдёт до игры
  // и пока мы читаем счёт, поэтому проверяем «не меньше половины кадров» — в разы гуще, чем с перезарядкой
  const beam = await shotsOverFrames(page, 20)
  expect(beam.shots).toBeGreaterThanOrEqual(beam.frames / 2)
  await openQuest(page, 2, 'Открыть «Пули»', 'Перезарядка')
  await addPieces(page, 2)
  await openQuest(page, 2, 'Открыть «Движок»', 'Время перезарядки')
  await page.keyboard.type('15')
  await run(page)
  // с перезарядкой 15 кадров — не больше одной пули на 16 кадров
  const burst = await shotsOverFrames(page, 40)
  expect(burst.shots).toBeGreaterThanOrEqual(1)
  expect(burst.shots).toBeLessThanOrEqual(Math.ceil(burst.frames / 16) + 1)
  await openQuest(page, 2, 'Выбрать цвет в «Движок»', 'Цвет пуль')
  await page.getByRole('dialog', { name: 'Выбери цвет' }).getByRole('button', { name: 'розовый', exact: true }).click()

  // шаг 3: пришельцы — волна, отрисовка, скорость, зигзаг, свой пришелец
  await openQuest(page, 3, 'Открыть «Пришельцы»')
  await addPieces(page, 4 + 2)
  await openQuest(page, 3, 'Открыть «Движок»', 'Скорость пришельцев')
  await page.keyboard.type('1')
  await openQuest(page, 3, 'Открыть «Пришельцы»', 'Зигзаг')
  await addPieces(page, 1)
  await openQuest(page, 3, 'Выбрать картинку в «Движок»')
  await pick(page, 'осьминог')
  await run(page)
  expect(await game(page, '[wave, enemies.length, enemyPic, bulletColor]')).toEqual([1, 5, 'осьминог', '#ec407a'])
  // у каждого своя скорость вбок: через полсекунды пришелец уже сдвинулся
  const x0 = await game<number>(page, 'enemies[0].x')
  await page.waitForTimeout(500)
  expect(await game<number>(page, 'enemies[0].x')).not.toBe(x0)

  // шаг 4: попадание — вложенный цикл, очко, прорыв
  await openQuest(page, 4, 'Открыть «Попадание»')
  await addPieces(page, 5)
  await openQuest(page, 4, 'Открыть «Попадание»', 'Очко за пришельца')
  await addPieces(page, 1)
  await openQuest(page, 4, 'Открыть «Попадание»', 'Пришелец прорвался')
  await addPieces(page, 1)
  await expect(progress(page)).toContainText('4/6')
  await run(page)

  // две пули в одного пришельца — одно очко (break), вторая летит дальше
  expect(
    await game(
      page,
      'enemies = [{ x: 100, y: 200, dx: 0 }, { x: 250, y: 200, dx: 0 }]; bullets = [{ x: 110, y: 180 }, { x: 112, y: 185 }]; checkHits(); [score, enemies.length, bullets.length]',
    ),
  ).toEqual([1, 1, 1])
  // последняя жизнь, пришелец у корабля — «Игра окончена»
  await game(page, 'lives = 1; enemies = [{ x: 100, y: 445, dx: 0 }]; checkHits()')
  const over = page.getByRole('button', { name: 'Начать заново' })
  await expect(over).toBeVisible()
  await over.click()
  await waitGame(page)
  expect(await game(page, '[lives, score]')).toEqual([3, 0])

  // «Границы» — про попадания
  const hitboxes = page.getByRole('switch', { name: 'Границы' })
  await expect(hitboxes).toHaveAttribute('title', /checkHits/)
  await hitboxes.click()
  await expect(hitboxes).toHaveAttribute('aria-checked', 'true')

  // взрывы и волны — после сборки игры, по две кнопки
  await tab(page, 'Гайд')
  await expect(page.getByRole('heading', { name: 'Взрывы и волны' })).toBeVisible()
  const booms = page.locator('#guide-task-5')
  await booms.getByRole('button', { name: 'Добавить переменную в «Движок»' }).click()
  await tab(page, 'Гайд')
  await booms.getByRole('button', { name: 'Вставить код в «Пришельцы» и «Попадание»' }).click()
  await tab(page, 'Гайд')
  const waves = page.locator('#guide-task-6')
  await waves.getByRole('button', { name: 'Добавить переменную в «Движок»' }).click()
  await tab(page, 'Гайд')
  await waves.getByRole('button', { name: 'Вставить код в «Пришельцы»' }).click()
  await expect(progress(page)).toContainText('6/6')
  await run(page)
  expect(await game(page, '[boomPic, maxSpeed, enemyPic]')).toEqual(['взрыв', 2, 'осьминог'])
  // сбил — взрыв (второй пришелец остаётся: иначе движок сам запустит новую волну); следующая — больше и быстрее
  expect(
    await game(
      page,
      'enemies = [{ x: 100, y: 200, dx: 0 }, { x: 300, y: 100, dx: 0 }]; bullets = [{ x: 110, y: 180 }]; checkHits(); booms.length',
    ),
  ).toBe(1)
  expect(await game(page, 'enemies = []; moveEnemies(); [wave, enemySpeed, enemies.length]')).toEqual([2, 1.25, 6])
  expect(errors).toEqual([])
})

test('Космос: готовая версия под паролем', async ({ page }) => {
  await page.goto(`${app()}?game=space&finished`)
  await page.getByLabel('Пароль').fill('000110')
  await page.getByRole('button', { name: 'Открыть' }).click()
  await waitGame(page)
  await expect(page).toHaveTitle('HitBox — готовая игра Космос')
  await expect(page.getByRole('heading', { name: 'Что тут есть' })).toBeVisible()
  expect(await game(page, '[shipSpeed, bulletSpeed, reloadTime, enemySpeed, boomPic]')).toEqual([6, 9, 12, 1, 'взрыв'])
  const held = await shotsOverFrames(page, 40)
  expect(held.shots).toBeGreaterThanOrEqual(1)
  expect(held.shots).toBeLessThanOrEqual(Math.ceil(held.frames / 13) + 1)
})

test('зажатая клавиша отпускается, когда игра теряет фокус', async ({ page }) => {
  await open(page, '?game=space')
  // после загрузки игра сама забирает фокус
  await expect.poll(() => game(page, 'document.hasFocus()')).toBe(true)
  await page.keyboard.down(' ')
  await page.keyboard.down('ArrowLeft')
  await expect.poll(() => game(page, '[keys[" "], keys.ArrowLeft]')).toEqual([true, true])
  // клик мимо игры: keyup до неё уже не дойдёт — обвязка отпускает клавиши сама
  await page.getByRole('heading', { level: 1, name: 'Космос' }).click()
  await expect.poll(() => game(page, '[keys[" "], keys.ArrowLeft]')).toEqual([false, false])
  await page.keyboard.up(' ')
  await page.keyboard.up('ArrowLeft')
})

test('шапка помещается на любой ширине у всех игр: страница не уезжает вбок', async ({ page }) => {
  test.setTimeout(90_000)
  for (const id of ['catch', 'bird', 'space']) {
    await page.goto(`${app()}?game=${id}`)
    await waitGame(page)
    for (const width of [1440, 1280, 1100, 1024, 900, 700, 641, 375]) {
      await page.setViewportSize({ width, height: 800 })
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth), {
          message: `${id}, ширина ${width}`,
        })
        .toBeLessThanOrEqual(0)
    }
  }
})

test('Космос на телефоне: нет прокрутки вбок, три кнопки и «Границы» на корпусе', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await open(page, '?game=space')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  for (const name of ['Влево', 'Вправо', 'Огонь'])
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Границы' })).toBeVisible()
})
