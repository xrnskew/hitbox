import {
  after,
  append,
  before,
  choicePiece,
  createPicQuest,
  decl,
  drawPicQuest,
  has,
  into,
  numberAbove0,
  numberQuest,
  pickPicQuest,
  rightChoice,
  runQuest,
  settingVar,
  shell,
} from '../kit.ts'
import type { BuildTask, EditTask, RunTask } from '../types.ts'
import { FALL_LINE, HERO_PIC, SPEED_LINE } from './tabs.ts'

// Квесты шагов «Корзинки». Код шага собирается кнопками «Добавить» по кусочкам и в итоге совпадает с STEP_* из tabs.ts.
// Помощники (куда вставить кусок, как проверить) — общие для всех игр, в lessons/kit.ts.

// ===== Шаг 1. Герой: создать картинку → выбрать → нарисовать → собрать → движение → скорость =====

export const HERO_CREATE_TASK = createPicQuest({
  title: 'Создай героя',
  text: 'Герой — это картинка. Открой «Герой»: там всплывёт строчка с ней — жми «Добавить».',
  tab: 1,
  name: 'playerPic',
  pic: HERO_PIC,
  piece: 'Картинка героя',
  comment: 'герой — любая картинка',
  doneText: 'Герой создан! Теперь нажми «Сменить» рядом с картинкой и выбери, кем он будет.',
})

export const HERO_PICK_TASK = pickPicQuest({
  title: 'Выбери героя',
  text: `Сейчас герой — ${HERO_PIC}. Нажми «Сменить» рядом с картинкой и выбери своего — например, кота или робота.`,
  tab: 1,
  name: 'playerPic',
  pic: HERO_PIC,
  hint: `Это строка \`var playerPic = "${HERO_PIC}";\` во вкладке «Герой». Кнопка «Сменить» — прямо рядом с ней. Можно и напечатать имя картинки между кавычками самому: "кот", "лиса", "робот".`,
})

export const HERO_DRAW_TASK = drawPicQuest({
  title: 'Нарисуй героя',
  text: 'Движок 60 раз в секунду зовёт `drawPlayer()`. Собери её по кусочкам — кнопки «Добавить» всплывут в «Герое».',
  tab: 1,
  fn: 'drawPlayer',
  pic: 'playerPic',
  x: 'playerX',
  y: 'playerY',
  doneText: 'Все кусочки героя на месте!',
})

export const HERO_RUN_TASK = runQuest({
  title: 'Собери игру',
  text: 'Нажми «Собрать» или [[Ctrl]] + [[Enter]] — герой появится внизу экрана.',
  callout: 'Герой нарисован! Нажми «Собрать» — и он появится на экране.',
  doneText: 'Вот твой герой!',
  after: [HERO_DRAW_TASK],
})

// Две развилки — решения ученика: знак движения влево (строка вправо дана готовой — по ней и догадаться)
// и сравнение у левого края (строка для правого края — готовая). Верный ли выбор, покажет игра: см. HERO_CHECK_TASK.
const RIGHT_LINE = /["']ArrowRight["']/

export const LEFT_PIECE = choicePiece({
  title: 'Стрелка ← — едем влево',
  text: '  if (keys["ArrowLeft"])  playerX = playerX [?] playerSpeed;',
  // над строкой для → — как в готовом коде
  where: (code, text) => before(code, RIGHT_LINE, text),
  question: 'Жмёшь ← — что делаем с playerX?',
  options: ['+', '-'],
  answer: '-',
})

export const EDGE_PIECE = choicePiece({
  title: 'Не уезжать за край',
  text: '\n  // не даём герою уехать за край поля\n  if (playerX [?] 0)   playerX = 0;\n  if (playerX > 340) playerX = 340;',
  where: (code, text) => into('movePlayer', text)(code),
  also: (code) => has(code, /\bif\s*\(\s*playerX\s*>\s*340\s*\)/),
  question: 'Когда вернуть героя к левому краю, в 0?',
  options: ['<', '>'],
  answer: '<',
})

export const HERO_MOVE_TASK: BuildTask = {
  kind: 'build',
  title: 'Научи героя ездить',
  text: 'Движок зовёт и `movePlayer()`: она слушает стрелки и двигает героя на `playerSpeed` пикселей. Собери её по кусочкам в «Герое». Два места реши сам: там, где [?], нажми и выбери вариант.',
  tab: 1,
  pieces: [
    settingVar('Скорость героя', 'playerSpeed', SPEED_LINE()),
    shell('movePlayer'),
    {
      title: 'Стрелка → — едем вправо',
      plan: into('movePlayer', '  if (keys["ArrowRight"]) playerX = playerX + playerSpeed;'),
      isDone: (code) => has(code, RIGHT_LINE),
    },
    LEFT_PIECE,
    EDGE_PIECE,
  ],
  doneText: 'Движение готово! Но герой пока стоит: его скорость playerSpeed — 0. Следующий квест — в «Гайде».',
}

export const SPEED_TASK = numberQuest({
  title: 'Дай герою скорость',
  text: 'Герой стоит, потому что его скорость `playerSpeed` — 0. Она прямо тут, в «Герое», над `movePlayer`. Поставь число от 5 до 7, нажми «Собрать» и проверь стрелками.',
  tab: 1,
  name: 'playerSpeed',
  hint: 'Это строка `var playerSpeed = 0;` во вкладке «Герой». Это сколько пикселей герой проезжает за кадр: 5 — спокойно, 7 — шустро. Попробуй разные!',
})

/** Проверка развилок героя: засчитана, когда собрана игра со скоростью и верными знаками. */
export const HERO_CHECK_TASK: RunTask = {
  kind: 'run',
  title: 'Проверь стрелки',
  text: 'Нажми «Собрать», кликни по экрану и покатайся [[←]] [[→]]. Герой едет туда, куда жмёшь? И останавливается у левого края?',
  tab: 1,
  callout: 'Собери игру и покатайся стрелками.',
  doneText: 'Герой слушается стрелок!',
  isDone: (ran) =>
    numberAbove0('playerSpeed')(ran[1] ?? '') &&
    rightChoice(LEFT_PIECE, ran[1] ?? '') &&
    rightChoice(EDGE_PIECE, ran[1] ?? ''),
  wrong: {
    // собрал с выбранными вариантами и со скоростью, но где-то не тот
    check: (ran) =>
      numberAbove0('playerSpeed')(ran[1] ?? '') &&
      [LEFT_PIECE, EDGE_PIECE].every((p) => p.isDone(ran[1] ?? '')) &&
      ![LEFT_PIECE, EDGE_PIECE].every((p) => rightChoice(p, ran[1] ?? '')),
    say: 'Посмотри на игру — так и задумано?',
    piece: (ran) => (rightChoice(LEFT_PIECE, ran[1] ?? '') ? EDGE_PIECE : LEFT_PIECE),
    hint: (ran) =>
      rightChoice(LEFT_PIECE, ran[1] ?? '')
        ? 'Герой прилип к левому краю? Проверь знак в строке `if (playerX … 0)`: в 0 героя надо возвращать, только когда он уехал левее нуля.'
        : 'Нажми [[←]] — куда поехал герой? Проверь знак в строке с `ArrowLeft` и сравни со строкой `ArrowRight`: вправо x растёт, а влево?',
  },
}

// ===== Шаг 2. Яблоки: падают → рисуются → скорость → «Всё быстрее» =====

const FRAME_TICK = /\bframe\s*=\s*frame\s*\+\s*1\s*;/

export const ITEMS_MOVE_TASK: BuildTask = {
  kind: 'build',
  title: 'Яблоки падают',
  text: 'Собери `moveItems()` в «Яблоках»: раз в секунду сверху появляется яблоко, и все яблоки летят вниз на `fallSpeed` пикселей.',
  tab: 2,
  pieces: [
    settingVar('Скорость яблок', 'fallSpeed', FALL_LINE()),
    shell('moveItems'),
    {
      title: 'Считать кадры',
      plan: into('moveItems', '  frame = frame + 1;'),
      isDone: (code) => has(code, FRAME_TICK),
    },
    {
      title: 'Раз в секунду — новое яблоко',
      plan: into(
        'moveItems',
        '\n  // раз в spawnEvery кадров — новое яблоко в случайном месте сверху\n  if (frame % spawnEvery === 0) {\n    items.push({ x: Math.random() * 340, y: 0 });\n  }',
      ),
      isDone: (code) => has(code, /\bitems\.push\s*\(/),
    },
    {
      title: 'Все яблоки опускаются вниз',
      plan: into(
        'moveItems',
        '\n  // все яблоки опускаются вниз\n  for (var i = 0; i < items.length; i++) {\n    items[i].y = items[i].y + fallSpeed;\n  }',
      ),
      isDone: (code) => has(code, /(\+|\+=)\s*fallSpeed\b/),
    },
  ],
  doneText: 'Яблоки появляются! Нажми «Собрать»: в «Приборах» растёт items. Но их пока не видно — дальше нарисуем.',
}

export const ITEMS_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Нарисуй яблоки',
  text: 'Собери `drawItems()`: она рисует каждое яблоко из массива `items`.',
  tab: 2,
  pieces: [
    shell('drawItems'),
    {
      title: 'Нарисовать каждое яблоко',
      plan: into(
        'drawItems',
        '  for (var i = 0; i < items.length; i++) {\n    drawPic(itemPic, items[i].x, items[i].y);\n  }',
      ),
      // любой вызов drawPic: в коде бомбы и звезды рисуется drawPic(pic, …)
      isDone: (code) => has(code, /\bdrawPic\s*\(/),
    },
  ],
  doneText: 'Яблоки нарисованы! Но они висят над экраном: их скорость fallSpeed — 0. Следующий квест — в «Гайде».',
}

export const FALL_SPEED_TASK = numberQuest({
  title: 'Дай яблокам скорость',
  text: 'Яблоки появляются, но висят над экраном: их скорость `fallSpeed` — 0. Она тут же, в «Яблоках», над `moveItems`. Поставь 3, нажми «Собрать» — и они полетят вниз.',
  tab: 2,
  name: 'fallSpeed',
  hint: 'Это строка `var fallSpeed = 0;` во вкладке «Яблоки». Это сколько пикселей яблоко пролетает за кадр. 3 — в самый раз, больше — ловить труднее.',
})

const SPEEDUP_DECL = decl('speedUp')
const SPEEDUP_IF = /\bif\s*\(\s*frame\s*%\s*900\s*===\s*0\s*&&\s*fallSpeed\s*<\s*8\s*\)\s*\{/
const SPEEDUP_STEP = /\bfallSpeed\s*=\s*fallSpeed\s*\+\s*1\s*;/
const SPEEDUP_CALL = /(^|[^\w.$])speedUp\s*\(\s*\)\s*;/m

export const SPEEDUP_TASK: BuildTask = {
  kind: 'build',
  title: 'Всё быстрее',
  text: 'Каждые 15 секунд яблоки падают быстрее, но не быстрее 8. Открой «Яблоки»: части функции всплывут прямо в коде — жми «Добавить» по порядку.',
  tab: 2,
  pieces: [
    {
      title: 'Пустая функция speedUp',
      plan: append('// каждые 15 секунд игра становится быстрее\nfunction speedUp() {\n}'),
      isDone: (code) => has(code, SPEEDUP_DECL),
    },
    {
      title: 'Раз в 15 секунд, пока скорость меньше 8',
      plan: (code) => after(code, SPEEDUP_DECL, '  if (frame % 900 === 0 && fallSpeed < 8) {\n  }'),
      isDone: (code) => has(code, SPEEDUP_IF),
    },
    {
      title: 'Прибавить скорость',
      plan: (code) => after(code, SPEEDUP_IF, '    fallSpeed = fallSpeed + 1;'),
      isDone: (code) => has(code, SPEEDUP_IF) && has(code, SPEEDUP_STEP),
    },
    {
      title: 'Вызывать каждый кадр в moveItems',
      plan: (code) => (has(code, SPEEDUP_DECL) ? after(code, FRAME_TICK, '  speedUp();') : null),
      isDone: (code) => has(code, SPEEDUP_CALL),
    },
  ],
  doneText: 'Функция собрана! Через 15 секунд после запуска яблоки полетят быстрее.',
}

// ===== Шаг 3. Поимка: собрать checkCatch → десять очков =====

const CATCH_LOOP = /\bfor\s*\(\s*var\s+i\s*=\s*items\.length\s*-\s*1\b/
const BLIZKO = /\bvar\s+blizko\s*=/

export const CATCH_TASK: BuildTask = {
  kind: 'build',
  title: 'Поймал или уронил',
  text: 'Собери `checkCatch()` в «Поимке»: для каждого яблока проверяем, поймал его герой или уронил.',
  tab: 3,
  pieces: [
    shell('checkCatch'),
    {
      title: 'Перебрать все яблоки с конца',
      plan: into('checkCatch', '  for (var i = items.length - 1; i >= 0; i--) {\n  }'),
      isDone: (code) => has(code, CATCH_LOOP),
    },
    {
      title: 'Яблоко рядом с героем?',
      plan: (code) => after(code, CATCH_LOOP, '    var blizko = Math.abs(items[i].x - playerX) < 34;'),
      isDone: (code) => has(code, BLIZKO),
    },
    {
      title: 'Поймал — очко, уронил — минус жизнь',
      plan: (code) =>
        after(
          code,
          BLIZKO,
          '\n    if (blizko && items[i].y > playerY - 34) {\n      // поймал — плюс очко\n      score = score + 1;\n      items.splice(i, 1);\n\n    } else if (items[i].y > 500) {\n      // уронил — минус жизнь\n      lives = lives - 1;\n      items.splice(i, 1);\n    }',
        ),
      isDone: (code) => has(code, /\bif\s*\(\s*blizko\b/) && has(code, /\.y\s*>\s*500\b/),
    },
  ],
  doneText: 'Поимка готова! Нажми «Собрать» и лови яблоки.',
}

export const TEN_POINTS_TASK: EditTask = {
  kind: 'edit',
  title: 'Десять очков',
  text: 'Пусть каждое пойманное яблоко даёт 10 очков, а не одно.',
  tab: 3,
  target: /score\s*=\s*score\s*\+\s*(?<points>\d+)/d,
  hint: ['Найди строку `score = score + 1;` и поменяй 1 на 10.'],
  isDone: (code) => has(code, /\bscore\s*(=\s*score\s*\+|\+=)\s*10\b/),
}
