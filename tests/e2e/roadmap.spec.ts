import { expect, type Page, test } from '@playwright/test'
import { birdStep1, buildHero, open, showStation, spaceStep1, tab } from './helpers.ts'

// Карта игры в гайде — у всех трёх игр. Код карты общий, а станции у каждой игры строятся из её данных:
// сколько шагов, какие картинки, как пронумерованы бонусы. Ожидания записаны здесь руками, а не взяты
// из уроков, — иначе тест не заметил бы ошибку в данных.

interface Game {
  id: string
  name: string
  /** Шаги: название, картинка на станции, сколько квестов во втором шаге — для строки «Ты здесь». */
  steps: { title: string; pic: string }[]
  /** Бонусы: номер задания (он же id блока `guide-task-N`), название, картинка. */
  extras: { n: number; title: string; pic: string }[]
  extrasTitle: string
  /** Квестов в шаге 1 и в шаге 2. */
  quests: [number, number]
  /** Пройти весь шаг 1. */
  step1: (page: Page) => Promise<void>
}

const GAMES: Game[] = [
  {
    id: 'catch',
    name: 'Корзинка',
    steps: [
      { title: 'Герой', pic: 'улыбка' },
      { title: 'Яблоки падают', pic: 'яблоко' },
      { title: 'Поймал или уронил', pic: 'корзинка' },
    ],
    extras: [
      { n: 4, title: 'Бомба', pic: 'бомба' },
      { n: 5, title: 'Звезда', pic: 'звезда' },
    ],
    extrasTitle: 'Бомба и звезда',
    quests: [6, 4],
    step1: (page) => buildHero(page),
  },
  {
    id: 'bird',
    name: 'Птичка',
    steps: [
      { title: 'Птица', pic: 'цыплёнок' },
      { title: 'Взмах', pic: 'птичка' },
      { title: 'Трубы', pic: 'труба' },
      { title: 'Удар и счёт', pic: 'звезда' },
    ],
    extras: [
      { n: 5, title: 'Монетки', pic: 'монетка' },
      { n: 6, title: 'Всё быстрее', pic: 'молния' },
    ],
    extrasTitle: 'Монетки и скорость',
    quests: [6, 2],
    step1: birdStep1,
  },
  {
    id: 'space',
    name: 'Космос',
    steps: [
      { title: 'Корабль', pic: 'ракета' },
      { title: 'Пули', pic: 'комета' },
      { title: 'Пришельцы', pic: 'пришелец' },
      { title: 'Попадание', pic: 'взрыв' },
    ],
    extras: [
      { n: 5, title: 'Взрывы', pic: 'взрыв' },
      { n: 6, title: 'Волна за волной', pic: 'пришелец' },
    ],
    extrasTitle: 'Взрывы и волны',
    quests: [6, 8],
    step1: spaceStep1,
  },
]

const mapOf = (page: Page) => page.getByRole('navigation', { name: 'Карта игры' })

/** Все блоки под картой: шаги, бонусы и заголовок финиша. */
function blocks(page: Page, g: Game) {
  return [
    ...g.steps.map((_, i) => page.locator(`#guide-step-${i + 1}`)),
    ...g.extras.map((x) => page.locator(`#guide-task-${x.n}`)),
  ]
}

for (const g of GAMES) {
  test.describe(`карта: ${g.name}`, () => {
    test('станции по порядку, ты здесь — шаг 1, каждая станция открывает свой блок', async ({ page }) => {
      const errors = await open(page, `?game=${g.id}`)
      const map = mapOf(page)
      const stations = map.getByRole('listitem')
      const pads = map.getByRole('button')

      // станции: шаги, бонусы, финиш — с подписями, картинками и состоянием
      const names = [
        `Шаг 1: ${g.steps[0].title} — ты здесь`,
        ...g.steps.slice(1).map((s, i) => `Шаг ${i + 2}: ${s.title} — закрыто`),
        ...g.extras.map((x) => `Бонус: ${x.title} — закрыто`),
        'Финиш — закрыто',
      ]
      const pics = [...g.steps.map((s) => s.pic), ...g.extras.map((x) => x.pic), 'подарок']
      await expect(stations).toHaveCount(names.length)
      for (let i = 0; i < names.length; i++) {
        await expect(pads.nth(i)).toHaveAccessibleName(names[i])
        await expect(stations.nth(i).locator('img')).toHaveAttribute('data-pic', pics[i])
      }
      await expect(map.locator('[aria-current="step"]')).toHaveAccessibleName(names[0])
      await expect(map).toContainText(`Ты здесь: шаг 1 «${g.steps[0].title}»`)
      await expect(map).toContainText(`квест 1 из ${g.quests[0]}`)

      // под картой — только шаг 1
      const all = blocks(page, g)
      await expect(all[0]).toBeVisible()
      for (const b of all.slice(1)) await expect(b).toBeHidden()

      // каждая станция открывает свой блок и прячет остальные
      for (let i = 0; i < all.length; i++) {
        await pads.nth(i).click()
        await expect(pads.nth(i)).toHaveAttribute('aria-pressed', 'true')
        await expect(all[i]).toBeVisible()
        // заголовок блока целиком, со скрытым для глаз номером: «Шаг 2 из 4. Взмах», «Задание 5. Монетки»
        const x = g.extras[i - g.steps.length]
        const title =
          i < g.steps.length ? `Шаг ${i + 1} из ${g.steps.length}. ${g.steps[i].title}` : `Задание ${x.n}. ${x.title}`
        await expect(all[i].getByRole('heading', { name: title, exact: true })).toBeVisible()
        for (let j = 0; j < all.length; j++) if (j !== i) await expect(all[j]).toBeHidden()
      }
      // бонус — под заголовком раздела бонусов
      await expect(page.getByRole('heading', { name: g.extrasTitle })).toBeVisible()
      await pads.last().click()
      await expect(page.getByRole('heading', { name: 'Финиш', exact: true })).toBeVisible()
      for (const b of all) await expect(b).toBeHidden()

      // кнопки внизу ведут по станциям подряд: от финиша назад до шага 1
      const near = page.getByRole('navigation', { name: 'Соседние станции' })
      await expect(near.getByRole('button', { name: /^Дальше/ })).toHaveCount(0)
      for (let i = all.length - 1; i >= 0; i--) {
        await near.getByRole('button', { name: /^Назад/ }).click()
        await expect(all[i]).toBeVisible()
      }
      await expect(near.getByRole('button', { name: /^Назад/ })).toHaveCount(0)
      expect(errors).toEqual([])
    })

    test('шаг 1 пройден — станция вспыхивает, ты здесь на шаге 2, под картой шаг 2', async ({ page }) => {
      test.setTimeout(60_000)
      const errors = await open(page, `?game=${g.id}`)
      const map = mapOf(page)
      await g.step1(page)
      // шаг закончили в коде — вспышка ждёт «Гайд»
      await page.waitForTimeout(400)
      await expect(map.locator('li[data-burst]')).toHaveCount(0)
      await tab(page, 'Гайд')

      const done = `Шаг 1: ${g.steps[0].title} — пройдено`
      await expect(map.locator('li[data-burst]').getByRole('button')).toHaveAccessibleName(done)
      await expect(map.locator('[aria-current="step"]')).toHaveAccessibleName(`Шаг 2: ${g.steps[1].title} — ты здесь`)
      await expect(map).toContainText(`Ты здесь: шаг 2 «${g.steps[1].title}»`)
      await expect(map).toContainText(`квест 1 из ${g.quests[1]}`)
      const [step1, step2] = blocks(page, g)
      await expect(step2).toBeVisible()
      await expect(step2).toHaveAttribute('data-state', 'active')
      await expect(step1).toBeHidden()
      await expect(map.locator('li[data-burst]')).toHaveCount(0, { timeout: 3000 })

      // к пройденному шагу можно вернуться — оттуда кнопка к следующему
      await showStation(page, done)
      await expect(step1).toHaveAttribute('data-state', 'done')
      await step1.getByRole('button', { name: 'Перейти к шагу 2' }).click()
      await expect(step2).toBeVisible()
      expect(errors).toEqual([])
    })
  })
}
