import { expect, type Page, test } from '@playwright/test'

/** Адрес сайта в проверках: сборка для Pages в подпапке /hitbox/. */
export const app = () => test.info().project.use.baseURL!
export const KEY = 'catch-sandbox-v2'

/** Открыть игру Корзинка с чистым хранилищем и дождаться редактора и игры. */
export async function open(page: Page, query = '?game=catch') {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto(app() + query)
  await expect(page.locator('.cm-editor')).toHaveCount(1)
  await waitGame(page)
  return errors
}

/** Дождаться, пока в iframe загрузится движок. */
export async function waitGame(page: Page) {
  await page.waitForFunction(() => {
    const w = document.querySelector('iframe')?.contentWindow as (Window & { loop?: unknown }) | null
    return typeof w?.loop === 'function'
  })
}

/** Вычислить выражение внутри игры. */
export function game<T = unknown>(page: Page, expr: string): Promise<T> {
  return page.evaluate((e) => {
    const w = document.querySelector('iframe')!.contentWindow as Window & { eval(x: string): unknown }
    return w.eval(e) as never
  }, expr)
}

/** Кнопка «Собрать» в шапке (в гайде есть такая же у квеста «Собери игру»). */
export const runButton = (page: Page) => page.getByRole('banner').getByRole('button', { name: /^Собрать/ })

export async function run(page: Page) {
  // каждый запуск — новый iframe: помечаем старый и ждём новый
  await page.evaluate(() => {
    ;(document.querySelector('iframe')!.contentWindow as Window & { __old?: number }).__old = 1
  })
  await runButton(page).click()
  await page.waitForFunction(() => {
    const w = document.querySelector('iframe')?.contentWindow as (Window & { __old?: number }) | null
    return !!w && !w.__old && w.document.readyState === 'complete'
  })
}

export async function tab(page: Page, title: string | RegExp) {
  await page.getByRole('tab', { name: title }).click()
}

/** Код всех вкладок из localStorage (после записи). */
export async function savedCodes(page: Page): Promise<string[]> {
  await page.waitForTimeout(500)
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), KEY)
}

/** Кнопка квеста в гайде: шаг n, подпись кнопки. quest — дождаться, что в гайде уже этот квест. */
export async function openQuest(page: Page, n: number, button: string | RegExp, quest?: string) {
  await tab(page, 'Гайд')
  const step = page.locator(`#guide-step-${n}`)
  // под картой видна одна станция: если открыта другая — выбрать шаг на карте
  if (await step.isHidden()) await showStation(page, new RegExp(`^Шаг ${n}:`))
  const scope = quest ? step.getByRole('region', { name: `Квест: ${quest}` }) : step
  await scope.getByRole('button', { name: button }).click()
}

/** Открыть станцию под картой в «Гайде»: шаг, бонус или финиш — по подписи кнопки на карте. */
export async function showStation(page: Page, name: string | RegExp) {
  await tab(page, 'Гайд')
  await page.getByRole('navigation', { name: 'Карта игры' }).getByRole('button', { name }).click()
}

/** Нажать «Добавить» у всплывающих в коде кусков `count` раз подряд. */
export async function addPieces(page: Page, count: number) {
  // кусок-вставка — «Добавить», кусок-замена — «Заменить»
  const add = page.locator('.cm-editor').getByRole('button', { name: /^(Добавить|Заменить):/ })
  for (let i = 0; i < count; i++) await add.click()
}

/** Квест бонуса N: открыть бонус на карте (если под ней другой), нажать кнопку квеста. */
export async function openBonusQuest(page: Page, n: number, button: string | RegExp, quest?: string) {
  await tab(page, 'Гайд')
  const box = page.locator(`#guide-task-${n}`)
  if (await box.isHidden()) await showStation(page, new RegExp(`^Бонус: ${await bonusTitle(page, n)}`))
  const scope = quest ? box.getByRole('region', { name: `Квест: ${quest}` }) : box
  await scope.getByRole('button', { name: button }).click()
}

const bonusTitle = (page: Page, n: number) =>
  page.locator(`#guide-task-${n} h3`).evaluate((h) => h.textContent!.replace(/^Задание \d+\.\s*/, ''))

/** Пройти бонус целиком: [кнопка квеста, сколько кусков] по порядку; «Собрать» в конце — сам `run`. */
export async function doBonus(page: Page, n: number, quests: [string, number][]) {
  for (const [button, pieces] of quests) {
    await openBonusQuest(page, n, button)
    await addPieces(page, pieces)
  }
  await run(page)
}

/** Выбрать картинку в открытом окне выбора. */
export async function pick(page: Page, pic: string) {
  await page.getByRole('dialog', { name: 'Выбери картинку' }).getByRole('button', { name: pic, exact: true }).click()
}

/** Шаг 1, квесты 1–4: создать героя, выбрать картинку, нарисовать, собрать. */
export async function drawHero(page: Page, pic = 'кот') {
  await openQuest(page, 1, 'Открыть «Герой»')
  await addPieces(page, 1)
  await page.locator('.cm-pick').first().click()
  await pick(page, pic)
  await addPieces(page, 2)
  await run(page)
}

/** Шаг 1, квесты 5–6: движение по кусочкам и скорость в «Движке». */
export async function moveHero(page: Page, speed = '6') {
  await openQuest(page, 1, 'Открыть «Герой»', 'Научи героя ездить')
  await addPieces(page, 4)
  await openQuest(page, 1, 'Открыть «Движок»', 'Дай герою скорость')
  await page.keyboard.type(speed)
}

/** Весь шаг 1. */
export async function buildHero(page: Page, pic = 'кот') {
  await drawHero(page, pic)
  await moveHero(page)
}

/** Шаг 2, квесты 1–3: яблоки падают, рисуются, скорость в «Движке». */
export async function buildApples(page: Page) {
  await openQuest(page, 2, 'Открыть «Яблоки»')
  await addPieces(page, 4 + 2)
  await openQuest(page, 2, 'Открыть «Движок»', 'Дай яблокам скорость')
  await page.keyboard.type('3')
}

/** Шаг 2, квест 3: собрать speedUp — кнопки «Добавить» всплывают прямо в коде «Яблок». */
export async function completeSpeedUp(page: Page) {
  await openQuest(page, 2, 'Открыть «Яблоки»', 'Всё быстрее')
  await addPieces(page, 4)
  await expect(page.locator('.cm-editor').getByRole('button', { name: /^Добавить:/ })).toHaveCount(0)
}

/** Шаг 3: собрать checkCatch и дать 10 очков — кнопка выделяет «1», печатаем «10». */
export async function buildCatch(page: Page) {
  await openQuest(page, 3, 'Открыть «Поимка»')
  await addPieces(page, 4)
  await openQuest(page, 3, 'Открыть «Поимка»', 'Десять очков')
  await page.keyboard.type('10')
}

/** Вся основная игра: три шага со всеми квестами. */
export async function buildGame(page: Page) {
  await buildHero(page)
  await buildApples(page)
  await completeSpeedUp(page)
  await buildCatch(page)
  await tab(page, 'Гайд')
}

/** Птичка, весь шаг 1: создать и нарисовать птицу, собрать, падение по кусочкам, гравитация 0.4. */
export async function birdStep1(page: Page) {
  await openQuest(page, 1, 'Открыть «Птица»')
  await addPieces(page, 1)
  await page.locator('.cm-pick').first().click()
  await pick(page, 'сова')
  await addPieces(page, 2)
  await run(page)
  await openQuest(page, 1, 'Открыть «Птица»', 'Птица падает')
  await addPieces(page, 4)
  await openQuest(page, 1, 'Открыть «Движок»', 'Включи гравитацию')
  await page.keyboard.type('0.4')
}

/** Космос, весь шаг 1: создать и нарисовать корабль, собрать, полёт по кусочкам, скорость 6. */
export async function spaceStep1(page: Page) {
  await openQuest(page, 1, 'Открыть «Корабль»')
  await addPieces(page, 1)
  await page.locator('.cm-pick').first().click()
  await pick(page, 'тарелка')
  await addPieces(page, 2)
  await run(page)
  await openQuest(page, 1, 'Открыть «Корабль»', 'Научи корабль летать')
  await addPieces(page, 4)
  await openQuest(page, 1, 'Открыть «Движок»', 'Скорость корабля')
  await page.keyboard.type('6')
}
