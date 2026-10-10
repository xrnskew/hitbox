import { expect, test } from '@playwright/test'
import {
  addPieces,
  app,
  doBonus,
  openBonusQuest,
  buildApples,
  buildGame,
  buildHero,
  drawHero,
  game,
  moveHero,
  open,
  openQuest,
  pick,
  run,
  showStation,
  runButton,
  savedCodes,
  tab,
  waitGame,
} from './helpers.ts'

// Чек-лист из раздела 11 ТЗ + квесты шагов, бомба и звезда, пароль.
// Каждый тест — с чистым хранилищем (у каждого теста свой контекст браузера).

test('1. игра уже крутится, вкладки шагов пустые, ошибок нет', async ({ page }) => {
  const errors = await open(page)
  await expect(page.getByRole('tab', { name: 'Гайд' })).toHaveAttribute('aria-selected', 'true')
  for (const t of ['Герой', 'Яблоки', 'Поимка'])
    await expect(page.getByRole('tab', { name: t })).toHaveAccessibleName(/пока только комментарий/)
  expect(await game(page, 'typeof loop')).toBe('function')
  expect(await game(page, 'lives')).toBe(3)
  expect(await game(page, 'typeof playSound')).toBe('undefined')
  // сверху и во вкладке браузера — название конструктора, в гайде — название игры
  await expect(page).toHaveTitle('HitBox — Корзинка')
  await expect(page.getByRole('banner')).toContainText('HitBox')
  await expect(page.getByRole('banner')).toContainText('конструктор игр')
  await expect(page.getByRole('heading', { level: 1, name: 'Корзинка' })).toBeVisible()
  await expect(runButton(page)).toBeVisible()
  await expect(runButton(page)).toHaveAttribute('data-dirty', 'false')
  // кнопки «Вставить» весь шаг больше нет — только сборка по кусочкам
  await expect(page.getByRole('button', { name: /^Вставить в/ })).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Прогресс' }).getByRole('button')).toHaveCount(5)
  await expect(page.getByRole('navigation', { name: 'Прогресс' })).toContainText('0/5')
  expect(errors).toEqual([])
})

test('главное меню: выбор игры, прогресс и возврат из игры', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(app())
  await expect(page).toHaveTitle('HitBox — конструктор игр')
  await expect(page.getByRole('heading', { level: 1, name: 'Выбери игру' })).toBeVisible()
  await expect(page.locator('iframe')).toHaveCount(0)
  const card = page.getByRole('article', { name: 'Корзинка' })
  await expect(card).toContainText('Очень легко')
  await expect(card).toContainText('Ещё не начата')
  await expect(page.getByLabel('Скоро')).toContainText('новые игры')

  // «Начать» открывает игру с гайдом
  await card.getByRole('link', { name: 'Начать Корзинка' }).click()
  await expect(page).toHaveURL(/\?game=catch$/)
  await waitGame(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Корзинка' })).toBeVisible()
  await drawHero(page, 'лиса')
  await moveHero(page)
  await savedCodes(page)

  // логотип в шапке ведёт в меню; карточка помнит прогресс и героя
  await page.getByRole('link', { name: 'HitBox — в главное меню' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Выбери игру' })).toBeVisible()
  await expect(card).toContainText('Пройдено 1 из 5')
  await expect(card.locator('[data-pic="лиса"]')).not.toHaveCount(0)
  await card.getByRole('link', { name: 'Продолжить Корзинка' }).click()
  await waitGame(page)
  expect(await game(page, 'playerPic')).toBe('лиса')

  // неизвестная игра в адресе — меню
  await page.goto(`${app()}?game=nope`)
  await expect(page.getByRole('heading', { level: 1, name: 'Выбери игру' })).toBeVisible()
  await page.setViewportSize({ width: 375, height: 800 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await page.screenshot({ path: 'test-results/shots/375-home.png', fullPage: true })
  expect(errors).toEqual([])
})

test('2. шаг 1: герой ездит стрелками, страница не прокручивается', async ({ page }) => {
  await open(page)
  await drawHero(page, 'лиса')
  await expect(page.getByRole('tab', { name: 'Герой' })).toHaveAttribute('aria-selected', 'true')
  expect(await game(page, 'playerPic')).toBe('лиса')
  await moveHero(page)
  await run(page)
  // игра забрала фокус сама
  await expect(page.getByText('Играем: жми')).toBeVisible()
  await expect(page.getByText('Кликни, чтобы играть')).toHaveCount(0)
  // клик в редактор уводит фокус, клик по игре — возвращает
  await page.locator('.cm-content').click()
  await expect(page.getByText('Кликни, чтобы играть')).toBeVisible()
  await page.getByText('Кликни, чтобы играть').click()
  await expect(page.getByText('Играем: жми')).toBeVisible()
  const x0 = await game<number>(page, 'playerX')
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(300)
  await page.keyboard.up('ArrowRight')
  expect(await game<number>(page, 'playerX')).toBeGreaterThan(x0 + 30)
  // стрелки на корпусе не забирают фокус: «Кликни, чтобы играть» не всплывает
  const right = page.getByRole('button', { name: 'Вправо' })
  const box = (await right.boundingBox())!
  const x1 = await game<number>(page, 'playerX')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(300)
  await expect(page.getByText('Кликни, чтобы играть')).toHaveCount(0)
  await page.mouse.up()
  expect(await game<number>(page, 'playerX')).toBeGreaterThan(x1 + 30)
  await expect(page.getByText('Играем: жми')).toBeVisible()
  expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0)
  await expect(page.getByRole('tab', { name: 'Герой' })).toHaveAccessibleName(/шаг сделан/)
})

test('шаг 1 по квестам: картинка из окна, подсветка «Собрать», скорость 0', async ({ page }) => {
  await open(page)
  const step1 = page.locator('#guide-step-1')
  const step2 = page.locator('#guide-step-2')
  await expect(step2).toHaveAttribute('data-state', 'locked')
  // виден только текущий квест
  await expect(step1.getByRole('region', { name: /^Квест:/ })).toHaveCount(1)
  await expect(step1.getByRole('region', { name: 'Квест: Создай героя' })).toBeVisible()

  // 1. создать героя: кусок всплывает в «Герое»
  await openQuest(page, 1, 'Открыть «Герой»')
  await expect(page.locator('.cm-editor').getByRole('button', { name: 'Добавить: Картинка героя' })).toBeVisible()
  await addPieces(page, 1)
  await expect(page.getByRole('status')).toContainText('Герой создан')
  await expect(runButton(page)).toHaveAttribute('data-dirty', 'true')

  // 2. выбрать героя: кнопка в гайде сразу открывает окно у картинки
  await openQuest(page, 1, 'Выбрать картинку в «Герой»')
  const picker = page.getByRole('dialog', { name: 'Выбери картинку' })
  await expect(picker).toBeVisible()
  // улыбка, с которой начинают, в окне отмечена
  await expect(picker.getByRole('button', { pressed: true })).toHaveAccessibleName('улыбка')
  // все рисунки в окне — настоящие картинки: SVG разобрался и загрузился
  const pics = picker.locator('section img')
  await expect(pics).toHaveCount(126)
  await expect
    .poll(() => pics.evaluateAll((imgs) => imgs.filter((i) => (i as HTMLImageElement).naturalWidth > 0).length))
    .toBe(126)
  await pick(page, 'лиса')
  await expect(picker).toHaveCount(0)
  expect((await savedCodes(page))[1]).toContain('var playerPic = "лиса";')
  await expect(page.getByRole('status')).toContainText('Квест «Выбери героя» выполнен')

  // 3. нарисовать: после последнего куска всё темнеет, «Собрать» светится поверх
  await addPieces(page, 2)
  await expect(runButton(page)).toHaveAttribute('data-spot', 'true')
  await expect(runButton(page)).toBeFocused()
  await expect(page.locator('#run-callout')).toContainText('Нажми «Собрать»')
  await page.keyboard.press('Escape')
  await expect(runButton(page)).toHaveAttribute('data-spot', 'false')
  // закрыли подсветку — кнопка просто подпрыгивает
  await expect(runButton(page)).toHaveAttribute('data-dirty', 'true')

  // 4. собрать: герой на экране, изменений нет
  await run(page)
  await expect(page.getByRole('status')).toContainText('Вот твой герой')
  // рисунок героя в игре загрузился: середина его холста не прозрачная
  await expect
    .poll(() =>
      game(page, 'var c = picture("лиса"); c.getContext("2d").getImageData(c.width >> 1, c.height >> 1, 1, 1).data[3]'),
    )
    .toBeGreaterThan(0)
  await expect(runButton(page)).toHaveAttribute('data-dirty', 'false')
  await expect(runButton(page)).toHaveAttribute('data-spot', 'false')

  // 5. движение по кусочкам — но скорость в «Движке» 0, герой стоит
  await openQuest(page, 1, 'Открыть «Герой»')
  await addPieces(page, 4)
  await expect(page.getByRole('status')).toContainText('скорость playerSpeed — 0')
  await run(page)
  await page.locator('iframe').click()
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(200)
  await page.keyboard.up('ArrowRight')
  expect(await game(page, 'playerX')).toBe(170)
  await tab(page, 'Гайд')
  await expect(step2).toHaveAttribute('data-state', 'locked')

  // 6. скорость: кнопка выделяет 0, печатаем 6 (советуем 5–7)
  await expect(step1).toContainText('от 5 до 7')
  await openQuest(page, 1, 'Открыть «Движок»')
  await page.keyboard.type('6')
  expect((await savedCodes(page))[0]).toContain('var playerSpeed = 6;')
  await expect(page.getByRole('status')).toContainText('Шаг 2 открыт')
  await tab(page, 'Гайд')
  await expect(step1).toHaveAttribute('data-state', 'done')
  await expect(step2).toHaveAttribute('data-state', 'active')
  await expect(page.locator('#guide-step-3')).toHaveAttribute('data-state', 'locked')
  await expect(page.getByRole('navigation', { name: 'Прогресс' })).toContainText('1/5')
  // подсветка была один раз: дальше «Собрать» только подпрыгивает
  await expect(runButton(page)).toHaveAttribute('data-dirty', 'true')
  await expect(runButton(page)).toHaveAttribute('data-spot', 'false')
})

test('кусок кода печатается на глазах, следующий всплывает после', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await open(page)
  await openQuest(page, 1, 'Открыть «Герой»')
  await addPieces(page, 1)
  // код уже во вкладке целиком, но ещё «не напечатан»: прозрачный, с курсором
  await expect(page.locator('.cm-typingCaret')).toHaveCount(1)
  await expect(page.locator('.cm-typingHidden').first()).toBeAttached()
  expect((await savedCodes(page))[1]).toContain('var playerPic = "улыбка";')
  await expect(page.locator('.cm-typingCaret')).toHaveCount(0, { timeout: 3000 })
  await expect(page.locator('.cm-typingHidden')).toHaveCount(0)
  // выбрали картинку — следующий кусок; пока он печатается, кнопки «Добавить» нет
  await page.locator('.cm-pick').first().click()
  await pick(page, 'лягушка')
  const add = page.locator('.cm-editor').getByRole('button', { name: /^Добавить:/ })
  await add.click()
  await expect(add).toHaveCount(0)
  await expect(page.locator('.cm-typingCaret')).toHaveCount(1)
  await expect(add).toHaveCount(1, { timeout: 3000 })
  await expect(page.locator('.cm-typingCaret')).toHaveCount(0)
  // Ctrl+Z во время печати убирает кусок и курсор
  await add.click()
  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator('.cm-typingCaret')).toHaveCount(0)
  expect((await savedCodes(page))[1]).not.toContain('ctx.font')
})

test('«Сменить» у картинки в коде: окно закрывается по Escape и клику мимо', async ({ page }) => {
  await open(page)
  await tab(page, 'Движок')
  const pickBtn = page.locator('.cm-editor').getByRole('button', { name: 'Сменить картинку' })
  // в «Движке» картинка одна — яблоко
  await expect(pickBtn).toHaveCount(1)
  const picker = page.getByRole('dialog', { name: 'Выбери картинку' })
  await pickBtn.click()
  await expect(picker.getByRole('button', { name: 'яблоко', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.keyboard.press('Escape')
  await expect(picker).toHaveCount(0)
  await pickBtn.click()
  await page.getByText('Готовый движок').click()
  await expect(picker).toHaveCount(0)
  await pickBtn.click()
  await pick(page, 'пончик')
  expect((await savedCodes(page))[0]).toContain('var itemPic     = "пончик";')
  // это правка ученика: Ctrl+Z возвращает яблоко
  await page.keyboard.press('ControlOrMeta+z')
  expect((await savedCodes(page))[0]).toContain('var itemPic     = "яблоко";')
  await expect(runButton(page)).toHaveAttribute('data-dirty', 'false')
  await pickBtn.click()
  await pick(page, 'пончик')
  await expect(runButton(page)).toHaveAttribute('data-dirty', 'true')
  await run(page)
  expect(await game(page, 'itemPic')).toBe('пончик')
  await expect(runButton(page)).toHaveAttribute('data-dirty', 'false')
})

test('«Всё быстрее»: части функции всплывают в коде «Яблок» и добавляются по очереди', async ({ page }) => {
  await open(page)
  await buildHero(page)
  await buildApples(page)
  // в гайде кнопок нет — только какие части на месте и переход во вкладку
  await tab(page, 'Гайд')
  const guideTask = page.locator('#guide-step-2')
  // следующий квест прячется, пока не собрано ускорение
  await expect(guideTask.getByRole('region', { name: /^Квест:/ })).toHaveCount(1)
  await expect(guideTask.getByRole('button', { name: /^Добавить:/ })).toHaveCount(0)
  await expect(guideTask.getByRole('list', { name: 'Части функции' }).getByRole('listitem')).toHaveCount(4)

  await guideTask.getByRole('button', { name: 'Открыть «Яблоки»' }).click()
  const add = page.locator('.cm-editor').getByRole('button', { name: /^Добавить:/ })
  const titles = [
    'Пустая функция speedUp',
    'Раз в 15 секунд, пока скорость меньше 8',
    'Прибавить скорость',
    'Вызывать каждый кадр в moveItems',
  ]
  for (const t of titles) {
    // всплывает ровно одна часть — следующая по порядку
    await expect(add).toHaveCount(1)
    await expect(add).toHaveAccessibleName(`Добавить: ${t}`)
    if (t === titles[3]) {
      // кусок стоит под строкой «frame = frame + 1;» (5-я), и номера строк ниже не съехали
      // (ждём, пока CodeMirror перемерит строки после появления куска)
      await expect
        .poll(() =>
          page.evaluate(() => {
            const g = [...document.querySelectorAll('.cm-lineNumbers .cm-gutterElement')].find(
              (e) => e.textContent === '6',
            )!
            const l = document.querySelectorAll('.cm-line')[5]
            return Math.abs(g.getBoundingClientRect().top - l.getBoundingClientRect().top)
          }),
        )
        .toBeLessThan(1)
    }
    await add.click()
  }
  await expect(add).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('Функция собрана')
  const apples = (await savedCodes(page))[2]
  expect(apples).toContain('  frame = frame + 1;\n  speedUp();')
  expect(apples).toContain(
    'function speedUp() {\n  if (frame % 900 === 0 && fallSpeed < 8) {\n    fallSpeed = fallSpeed + 1;\n  }\n}',
  )
  // «Всё быстрее» — последний квест шага 2: шаг пройден, открылся шаг 3, а падают по-прежнему яблоки
  await tab(page, 'Гайд')
  await expect(page.locator('#guide-step-2')).toHaveAttribute('data-state', 'done')
  await expect(page.locator('#guide-step-3')).toHaveAttribute('data-state', 'active')
  await run(page)
  expect(await game(page, 'itemPic')).toBe('яблоко')
  await game(page, 'frame = 899; moveItems()')
  expect(await game(page, 'fallSpeed')).toBe(4)
  await game(page, 'fallSpeed = 8; frame = 1799; moveItems()')
  expect(await game(page, 'fallSpeed')).toBe(8)
})

test('3. вся игра: яблоки падают и ловятся по 10 очков, жизни кончаются', async ({ page }) => {
  await open(page)
  await buildGame(page)
  await expect(page.getByRole('button', { name: /Шаг 3, «Поимка»: сделано$/ })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Прогресс' })).toContainText('3/5')
  await run(page)
  await page.waitForFunction(() => {
    const w = document.querySelector('iframe')!.contentWindow as Window & { items?: unknown[] }
    return (w.items?.length ?? 0) > 0
  })
  await game(page, 'items = [{ x: playerX, y: playerY }]; checkCatch()')
  expect(await game(page, 'score')).toBe(10)
  await game(page, 'lives = 1; items = [{ x: 0, y: 600 }]; playerX = 300; checkCatch()')
  expect(await game(page, 'lives')).toBe(0)
  // «Начать заново» — посередине экрана приставки
  const restart = page.getByRole('button', { name: 'Начать заново' })
  await expect(restart).toBeVisible()
  await expect(page.getByText('Рекорд:')).toBeVisible()
  const screen = (await page.locator('iframe').boundingBox())!
  const btn = (await restart.boundingBox())!
  const mid = (b: { y: number; height: number }) => b.y + b.height / 2
  expect(Math.abs(mid(btn) - mid(screen))).toBeLessThan(screen.height * 0.15)
})

test('4. сломанная скобка и ошибка выполнения: верная вкладка и строка', async ({ page }) => {
  await open(page)
  await buildGame(page)
  await tab(page, 'Поимка')
  // удаляем } цикла for — предпоследняя строка «Поимки»
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('End')
  await page.keyboard.press('Shift+Home')
  await page.keyboard.press('Shift+Home')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await runButton(page).click()
  const bar = page.getByRole('alert')
  await expect(bar).toContainText('Ошибка во вкладке «Поимка», строка 5: скобка { открыта, но не закрыта')
  await expect(page.locator('iframe').locator('xpath=..')).toHaveAttribute('data-game', 'blocked')
  expect(await page.evaluate(() => !!document.activeElement?.closest('.cm-editor'))).toBe(true)
  await expect(page.getByRole('tab', { name: 'Поимка' })).toHaveAccessibleName(/ошибка/)
  await page.keyboard.press('ControlOrMeta+z')
  await page.keyboard.press('ControlOrMeta+z')

  // ошибка выполнения в «Герое»
  await tab(page, 'Герой')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('drawBasket();')
  await page.keyboard.press('Escape')
  await run(page)
  await expect(bar).toContainText('Ошибка во вкладке «Герой», строка 19: drawBasket не найдено')
  await bar.getByRole('button', { name: 'Показать' }).click()
  await expect(page.getByRole('tab', { name: 'Герой' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('.cm-errorLine')).toHaveCount(1)
})

test('5–7. сохранение, сброс вкладки не трогает движок, Ctrl+Z и Ctrl+Shift+Z', async ({ page }) => {
  await open(page)
  await drawHero(page)
  // настройка в «Движке»: playerSpeed = 9
  await tab(page, 'Движок')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+Home')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('End')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Backspace')
  await page.keyboard.type('9;')
  expect((await savedCodes(page))[0]).toContain('var playerSpeed = 9;')

  await page.reload()
  await expect(page.locator('.cm-editor')).toHaveCount(1)
  let codes = await savedCodes(page)
  expect(codes[0]).toContain('var playerSpeed = 9;')
  expect(codes[1]).toContain('function drawPlayer()')

  await tab(page, 'Герой')
  await page.getByRole('button', { name: 'Сбросить вкладку' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Другие вкладки и настройки в «Движке» останутся как есть')
  await dialog.getByRole('button', { name: 'Сбросить вкладку' }).click()
  await expect(dialog).toBeHidden()
  codes = await savedCodes(page)
  expect(codes[1]).not.toContain('function drawPlayer()')
  expect(codes[0]).toContain('var playerSpeed = 9;')

  // фокус вернулся в редактор — Ctrl+Z работает сразу
  expect(await page.evaluate(() => !!document.activeElement?.closest('.cm-editor'))).toBe(true)
  await page.keyboard.press('ControlOrMeta+z')
  expect((await savedCodes(page))[1]).toContain('function drawPlayer()')
  await page.keyboard.press('ControlOrMeta+Shift+z')
  expect((await savedCodes(page))[1]).not.toContain('function drawPlayer()')
})

test('сброс движка: отдельное предупреждение, фокус на «Отмене»', async ({ page }) => {
  await open(page)
  await tab(page, 'Движок')
  await page.getByRole('button', { name: 'Сбросить движок' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Твои настройки пропадут')
  await expect(dialog.getByRole('button', { name: 'Отмена' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
})

/** Квесты бонусов Корзинки: [кнопка квеста, сколько кусков]; «Собери и проверь» — запуск в `doBonus`. */
const BOMB: [string, number][] = [
  ['Открыть «Движок»', 1],
  ['Открыть «Яблоки»', 3],
  ['Открыть «Яблоки»', 2],
  ['Открыть «Поимка»', 2],
]
const STAR: [string, number][] = [
  ['Открыть «Движок»', 1],
  ['Открыть «Яблоки»', 1],
  ['Открыть «Яблоки»', 1],
  ['Открыть «Поимка»', 1],
]

test('8. бомба и звезда: закрыты до сборки игры, квесты по одному, кусочки и замены, логика', async ({ page }) => {
  test.setTimeout(60_000)
  await open(page)
  const bomb = page.locator('#guide-task-4')
  const star = page.locator('#guide-task-5')
  // под картой одна станция: бомбу сначала открыть на карте
  await expect(bomb).toBeHidden()
  await showStation(page, /^Бонус: Бомба/)
  await expect(bomb).toHaveAttribute('data-locked', 'true')
  await expect(bomb).toContainText('Откроется, когда соберёшь игру')

  // игра собрана — под картой сама открылась бомба: ученик теперь там, на первом квесте
  await buildGame(page)
  await expect(bomb).toBeVisible()
  await expect(bomb).toHaveAttribute('data-locked', 'false')
  await expect(bomb.getByRole('region', { name: 'Квест: Картинка бомбы' })).toBeVisible()
  // звезда скрыта, пока под картой бомба, — и закрыта до бомбы
  await expect(star).toHaveAttribute('data-locked', 'true')

  // 1. картинка бомбы — одна строка в «Движок», остальные настройки на месте
  await openBonusQuest(page, 4, 'Открыть «Движок»')
  await addPieces(page, 1)
  let codes = await savedCodes(page)
  const lines = codes[0].split('\n')
  expect(lines[5]).toBe('var bombPic     = "бомба";')
  expect(lines[4]).toBe('var itemPic     = "яблоко";')

  // 2. яблоко или бомба: makeItem кусочками, а старую строку с items.push — заменить
  await openBonusQuest(page, 4, 'Открыть «Яблоки»')
  await addPieces(page, 2)
  const editor = page.locator('.cm-editor')
  const swap = editor.getByRole('button', { name: 'Заменить: Новый предмет — из makeItem' })
  await expect(swap).toBeVisible()
  await expect(editor.locator('.cm-slotOld')).toHaveCount(1)
  await expect(editor.locator('.cm-slotOld')).toContainText('items.push({ x: Math.random() * 340, y: 0 });')
  await swap.click()
  codes = await savedCodes(page)
  expect(codes[2]).toContain('items.push(makeItem());')
  expect(codes[2]).not.toContain('items.push({ x: Math.random() * 340, y: 0 });')
  // замену можно вернуть, как любой кусок
  await page.getByRole('status').getByRole('button', { name: 'Вернуть как было' }).click()
  codes = await savedCodes(page)
  expect(codes[2]).toContain('items.push({ x: Math.random() * 340, y: 0 });')
  await swap.click()

  // 3–5. нарисовать, поимка (обе строки — заменой), собрать
  for (const [button, pieces] of BOMB.slice(2)) {
    await openBonusQuest(page, 4, button)
    await addPieces(page, pieces)
  }
  codes = await savedCodes(page)
  expect(codes[2]).toContain('if (Math.random() < 0.2) kind = "bomb";')
  expect(codes[2]).toContain('drawPic(pic, items[i].x, items[i].y);')
  expect(codes[3]).toContain('if (items[i].kind === "bomb") {')
  expect(codes[3]).toContain('if (items[i].kind === "apple") lives = lives - 1;')
  // ускорение и 10 очков на месте
  expect(codes[2]).toContain('speedUp();')
  expect(codes[3]).toContain('score = score + 10;')
  // последний квест — «Собери и проверь»: как в шагах, всё темнеет, «Собрать» светится поверх
  await expect(runButton(page)).toHaveAttribute('data-spot', 'true')
  await run(page)
  await tab(page, 'Гайд')
  await expect(bomb).toHaveAttribute('data-done', 'true')

  await doBonus(page, 5, STAR)
  await tab(page, 'Гайд')
  await expect(star).toHaveAttribute('data-done', 'true')
  // все пять чек-поинтов пройдены, под картой — финиш
  await expect(page.getByRole('navigation', { name: 'Прогресс' })).toContainText('5/5')
  await expect(page.getByRole('button', { name: 'Дополнительно: «Звезда»: сделано' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Игра собрана' })).toBeVisible()

  await game(page, 'items = [{ x: playerX, y: playerY, kind: "bomb" }]; checkCatch()')
  expect(await game(page, 'lives')).toBe(2)
  await game(page, 'items = [{ x: playerX, y: playerY, kind: "gold" }]; checkCatch()')
  expect(await game(page, 'lives')).toBe(3)
  await game(
    page,
    'playerX = 300; items = [{ x: 0, y: 600, kind: "bomb" }, { x: 0, y: 600, kind: "gold" }]; checkCatch()',
  )
  expect(await game(page, 'lives')).toBe(3)
})

test('9. «Сбросить всё»: без слова кнопка неактивна, «Вернуть как было» возвращает код', async ({ page }) => {
  await open(page)
  await drawHero(page)
  await page.getByRole('button', { name: 'Сбросить всё' }).click()
  const dialog = page.getByRole('dialog')
  const confirm = dialog.getByRole('button', { name: 'Сбросить всё' })
  await expect(confirm).toBeDisabled()
  await dialog.getByRole('textbox').fill('сбро')
  await expect(confirm).toBeDisabled()
  await dialog.getByRole('textbox').fill('СБРОС')
  await expect(confirm).toBeEnabled()
  await confirm.click()
  await expect(page.getByRole('tab', { name: 'Гайд' })).toHaveAttribute('aria-selected', 'true')
  let codes = await savedCodes(page)
  expect(codes[1]).not.toContain('drawPlayer()')
  expect(codes[1]).not.toContain('playerPic')
  await page.getByRole('status').getByRole('button', { name: 'Вернуть как было' }).click()
  codes = await savedCodes(page)
  expect(codes[1]).toContain('function drawPlayer()')
  expect(codes[1]).toContain('var playerPic = "кот";')
})

test('10. ширина 375px: нет горизонтальной прокрутки', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 })
  await open(page)
  const wide = () => page.evaluate(() => document.documentElement.scrollWidth)
  expect(await wide()).toBeLessThanOrEqual(375)
  await tab(page, 'Движок')
  expect(await wide()).toBeLessThanOrEqual(375)
  const frame = await page.locator('iframe').boundingBox()
  expect(frame!.width).toBeLessThanOrEqual(375)
  await page.screenshot({ path: 'test-results/shots/375-engine.png', fullPage: true })
})

test('11. без сети: запросов наружу нет, шрифты загружены', async ({ page, context }) => {
  // свой сервер (сборка для Pages) — можно, всё остальное — «наружу»
  const own = new URL(app())
  const external: string[] = []
  const failed: string[] = []
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (!/^(file|data|about|blob):$/.test(url.protocol) && url.origin !== own.origin) {
      external.push(url.href)
      return route.abort()
    }
    return route.continue()
  })
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`)
  })
  await open(page)
  await drawHero(page)
  expect(
    await page.evaluate(
      async () => (await document.fonts.ready, [...document.fonts].filter((f) => f.status === 'loaded').length),
    ),
  ).toBeGreaterThan(0)
  expect(external).toEqual([])
  expect(failed).toEqual([])
})

test('шрифты и скрипты берутся по правильному адресу (base)', async ({ page }) => {
  const loaded: string[] = []
  const failed: string[] = []
  page.on('requestfinished', (r) => loaded.push(r.url()))
  page.on('requestfailed', (r) => failed.push(r.url()))
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`)
  })
  await open(page)
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready
    const fams = ['Onest', 'JetBrains Mono', 'Unbounded']
    return fams.map((f) => [...document.fonts].some((x) => x.family.replace(/"/g, '') === f && x.status === 'loaded'))
  })
  expect(fonts).toEqual([true, true, true])
  expect(failed).toEqual([])
  // сайт в подпапке: скрипты, стили и шрифты — из /hitbox/assets/
  const base = new URL(app())
  const assets = loaded.filter((u) => /\.(js|css|woff2)$/.test(u))
  expect(assets.length).toBeGreaterThan(3)
  for (const u of assets) expect(u.startsWith(`${base.origin}/hitbox/assets/`)).toBe(true)
})

test('живая проверка синтаксиса: значок и подчёркивание до запуска', async ({ page }) => {
  await open(page)
  await tab(page, 'Герой')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('function a() {')
  await expect(page.getByRole('tab', { name: 'Герой' })).toHaveAccessibleName(/ошибка/)
  await expect(page.locator('.cm-lintRange-error, .cm-lintPoint-error').first()).toBeVisible()
})

test('консоль, «Приборы», 60 кадров и «Границы»', async ({ page }) => {
  await open(page)
  await buildHero(page)
  await buildApples(page)
  await tab(page, 'Герой')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('console.log("привет", { a: 1.234 });')
  await page.keyboard.press('Escape')
  await run(page)
  await page.getByRole('tab', { name: 'Консоль' }).click()
  await expect(page.locator('#tool-panel')).toContainText('привет {"a":1.23}')

  await page.getByRole('tab', { name: 'Приборы' }).click()
  await expect(page.locator('#tool-panel')).toContainText('lives')
  await expect(page.locator('#tool-panel dd').nth(1)).toHaveText('3')

  // не больше 60 кадров в секунду: кадры делим на настоящее время — под нагрузкой секунда ожидания растягивается
  const perSecond = await page.evaluate(async () => {
    const w = document.querySelector('iframe')!.contentWindow as Window & { frame: number }
    const [f0, t0] = [w.frame, performance.now()]
    await new Promise((r) => setTimeout(r, 1000))
    return ((w.frame - f0) * 1000) / (performance.now() - t0)
  })
  expect(perSecond).toBeGreaterThan(30)
  expect(perSecond).toBeLessThan(66)

  const hitboxes = page.getByRole('switch', { name: 'Границы' })
  await hitboxes.click()
  await expect(hitboxes).toHaveAttribute('aria-checked', 'true')
})

test('лишних кнопок нет: «Поделиться», «Вид», пауза, кадр, замедление убраны', async ({ page }) => {
  await open(page)
  for (const name of ['Поделиться', 'Вид', 'Пауза', 'Кадр', 'Замедлить'])
    await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0)
})

test('карта игры: текущая станция со стрелкой, под картой — одна станция', async ({ page }) => {
  await open(page)
  const map = page.getByRole('navigation', { name: 'Карта игры' })
  await expect(map).toContainText('Ты здесь: шаг 1 «Герой»')
  await expect(map.locator('[aria-current="step"]')).toHaveAccessibleName('Шаг 1: Герой — ты здесь')
  await expect(map.getByRole('button', { name: 'Бонус: Бомба — закрыто' })).toBeVisible()
  await expect(map.getByRole('button', { name: 'Финиш — закрыто' })).toBeVisible()

  // под картой только текущий шаг
  const step1 = page.locator('#guide-step-1')
  const step2 = page.locator('#guide-step-2')
  await expect(step1).toBeVisible()
  await expect(step2).toBeHidden()
  await expect(map.getByRole('button', { name: /^Шаг 1:/ })).toHaveAttribute('aria-pressed', 'true')

  // станция на карте открывает свой блок, даже закрытый
  await map.getByRole('button', { name: /^Шаг 2:/ }).click()
  await expect(step2).toBeVisible()
  await expect(step2).toContainText('Откроется, когда выполнишь квесты шага 1.')
  await expect(step1).toBeHidden()
  await expect(map.getByRole('button', { name: /^Шаг 2:/ })).toHaveAttribute('aria-pressed', 'true')
  await expect(map.getByRole('button', { name: /^Шаг 1:/ })).toHaveAttribute('aria-pressed', 'false')

  // соседние станции — кнопками внизу
  const near = page.getByRole('navigation', { name: 'Соседние станции' })
  await near.getByRole('button', { name: /^Дальше/ }).click()
  await expect(page.locator('#guide-step-3')).toBeVisible()
  await near.getByRole('button', { name: /^Назад/ }).click()
  await near.getByRole('button', { name: /^Назад/ }).click()
  await expect(step1).toBeVisible()
  await map.getByRole('button', { name: 'Финиш — закрыто' }).click()
  await expect(page.getByRole('heading', { name: 'Финиш' })).toBeVisible()
  await expect(near.getByRole('button', { name: /^Дальше/ })).toHaveCount(0)
  // закрытый финиш — что осталось: все станции; кнопка ведёт на станцию
  const left = page.getByRole('list', { name: 'Что осталось' })
  await expect(left.getByRole('button')).toHaveCount(5)
  await expect(left.getByRole('button').first()).toContainText('ты здесь')
  await left.getByRole('button', { name: /Шаг 2\./ }).click()
  await expect(page.locator('#guide-step-2')).toBeVisible()
  await map.getByRole('button', { name: /^Шаг 2:/ }).click()

  // шаг 1 пройден: «ты здесь» переехало на шаг 2
  await buildHero(page)
  await page.waitForTimeout(400)
  // шаг прошли в коде — вспышка ждёт возвращения в «Гайд» и гаснет сама
  await expect(map.locator('li[data-burst]')).toHaveCount(0)
  await tab(page, 'Гайд')
  await expect(map.locator('li[data-burst]')).toHaveCount(1)
  await expect(map.locator('li[data-burst]').getByRole('button')).toHaveAccessibleName('Шаг 1: Герой — пройдено')
  await expect(map.locator('li[data-burst]')).toHaveCount(0, { timeout: 3000 })
  await expect(map.locator('[aria-current="step"]')).toHaveAccessibleName('Шаг 2: Яблоки падают — ты здесь')
  await expect(map.getByRole('button', { name: 'Шаг 1: Герой — пройдено' })).toBeVisible()
  await expect(map).toContainText('квест 1 из 4')
  // ученик ушёл дальше — выбор забыт, под картой новый текущий шаг
  await expect(step2).toBeVisible()
  await expect(step2).toHaveAttribute('data-state', 'active')

  // вернулся к пройденному шагу — оттуда кнопка к следующему
  await map.getByRole('button', { name: 'Шаг 1: Герой — пройдено' }).click()
  await expect(step1).toBeVisible()
  await step1.getByRole('button', { name: 'Перейти к шагу 2' }).click()
  await expect(step2).toBeVisible()
  await expect(step1).toBeHidden()

  // бонусная станция — её задание сразу под картой
  await map.getByRole('button', { name: 'Бонус: Звезда — закрыто' }).click()
  await expect(page.locator('#guide-task-5')).toBeInViewport()
  await expect(page.locator('#guide-task-4')).toBeHidden()
  await expect(step2).toBeHidden()
})

test('гайд: код, объяснение и подсказка открываются кнопками', async ({ page }) => {
  await open(page)
  const step = page.locator('#guide-step-1')
  await expect(step.locator('pre')).toHaveCount(0)
  await step.getByRole('button', { name: 'Готовый код' }).click()
  await expect(step.locator('pre')).toContainText('function movePlayer()')
  await step.getByRole('button', { name: 'Скрыть готовый код' }).click()
  await expect(step.locator('pre')).toHaveCount(0)
  await step.getByRole('button', { name: 'Как это работает' }).click()
  await expect(step).toContainText('Готовая функция движка drawPic рисует картинку')
  await openQuest(page, 1, 'Открыть «Герой»')
  await addPieces(page, 1)
  await tab(page, 'Гайд')
  await step.getByRole('button', { name: 'Подсказка' }).click()
  await expect(step).toContainText('var playerPic = "улыбка";')
})

test('готовая игра под паролем: из гайда и по прямой ссылке', async ({ page, context }) => {
  await open(page)
  await page.getByRole('button', { name: 'Открыть готовую игру' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Пароль').fill('123456')
  await dialog.getByRole('button', { name: 'Открыть' }).click()
  await expect(dialog.getByRole('alert')).toContainText('Пароль не подошёл')

  await dialog.getByLabel('Пароль').fill('000110')
  const popup = context.waitForEvent('page')
  await dialog.getByRole('button', { name: 'Открыть' }).click()
  const finished = await popup
  await expect(finished.getByRole('heading', { name: 'Что тут есть' })).toBeVisible()
  expect(finished.url()).toMatch(/\?game=catch&finished$/)
  await expect(finished).toHaveTitle('HitBox — готовая игра Корзинка')
  await expect(finished.getByRole('tab', { name: 'Гайд' })).toHaveCount(0)

  // по прямой ссылке без пароля — экран блокировки
  const direct = await (await page.context().browser()!.newContext()).newPage()
  await direct.goto(`${app()}?finished`)
  await expect(direct.getByRole('heading', { name: 'Готовая игра под паролем' })).toBeVisible()
  await expect(direct.locator('iframe')).toHaveCount(0)
  await direct.getByLabel('Пароль').fill('000110')
  await direct.getByRole('button', { name: 'Открыть' }).click()
  await waitGame(direct)
  await direct.evaluate(() => {
    const w = document.querySelector('iframe')!.contentWindow as Window & { eval(x: string): unknown }
    w.eval('items = [{ x: playerX, y: playerY, kind: "apple" }]; checkCatch()')
  })
  expect(
    await direct.evaluate(() => (document.querySelector('iframe')!.contentWindow as Window & { score: number }).score),
  ).toBe(10)
  expect(await direct.evaluate(() => localStorage.getItem('catch-sandbox-v2'))).toBeNull()
})

test('телефон: экранные стрелки двигают героя, холст чёткий, а для кода — 380 × 470', async ({ browser }) => {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  })
  const page = await ctx.newPage()
  await open(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await drawHero(page)
  await page.screenshot({ path: 'test-results/shots/375-hero.png' })
  await moveHero(page)
  await run(page)
  expect(await game(page, '[canvas.width, canvas.height]')).toEqual([380, 470])
  expect(
    await game<number>(page, 'Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, "width").get.call(canvas)'),
  ).toBeGreaterThan(380)
  const right = page.getByRole('button', { name: 'Вправо' })
  await expect(right).toBeVisible()
  const x0 = await game<number>(page, 'playerX')
  await right.dispatchEvent('pointerdown')
  await page.waitForTimeout(300)
  await right.dispatchEvent('pointerup')
  const x1 = await game<number>(page, 'playerX')
  expect(x1).toBeGreaterThan(x0 + 30)
  await page.waitForTimeout(200)
  expect(await game<number>(page, 'playerX')).toBe(x1)
  await ctx.close()
})

test('основные сценарии подряд — без единой ошибки в консоли', async ({ page, context }) => {
  // слушаем все страницы и кадры: и песочницу, и игру в iframe, и окно готовой игры
  const errors: string[] = []
  const watch = (p: typeof page) => {
    p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
    p.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`)
    })
  }
  watch(page)
  context.on('page', watch)

  await open(page)
  await buildGame(page)
  await run(page)
  await game(page, 'items = [{ x: playerX, y: playerY }]; checkCatch()')
  expect(await game(page, 'score')).toBe(10)
  await game(page, 'lives = 0')
  await page.getByRole('button', { name: 'Начать заново' }).click()
  await waitGame(page)

  await doBonus(page, 4, BOMB)
  await doBonus(page, 5, STAR)
  await run(page)
  await game(page, 'items = [{ x: playerX, y: playerY, kind: "gold" }]; checkCatch()')
  expect(await game(page, 'lives')).toBe(4)

  // приборы, консоль, границы
  await page.getByRole('tab', { name: 'Консоль' }).click()
  await page.getByRole('tab', { name: 'Приборы' }).click()
  await page.getByRole('switch', { name: 'Границы' }).click()

  // готовая игра по паролю
  await tab(page, 'Гайд')
  await page.getByRole('button', { name: 'Открыть готовую игру' }).click()
  await page.getByRole('dialog').getByLabel('Пароль').fill('000110')
  const popup = context.waitForEvent('page')
  await page.getByRole('dialog').getByRole('button', { name: 'Открыть' }).click()
  const finished = await popup
  await waitGame(finished)
  await page.waitForTimeout(500)

  expect(errors).toEqual([])
})
