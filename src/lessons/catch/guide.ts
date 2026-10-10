import type { GuideExtra, GuideIntro, GuideStep } from '../types.ts'
import { BOMB_QUESTS, GOLD_QUESTS } from './bonus.ts'
import { STEP_APPLES, STEP_CATCH, STEP_HERO } from './tabs.ts'
import {
  CATCH_TASK,
  FALL_SPEED_TASK,
  HERO_CREATE_TASK,
  HERO_DRAW_TASK,
  HERO_MOVE_TASK,
  HERO_PICK_TASK,
  HERO_RUN_TASK,
  ITEMS_DRAW_TASK,
  ITEMS_MOVE_TASK,
  SPEED_TASK,
  SPEEDUP_TASK,
  TEN_POINTS_TASK,
} from './tasks.ts'

// Тон: для подростка, который программирует впервые. Коротко, на «ты».
// Каждый шаг — цепочка квестов: код собирается кнопками «Добавить» по кусочкам прямо во вкладке.
// Подробности спрятаны за кнопкой «Как это работает».
// В тексте `код` — инлайн-код, [[Ctrl]] — клавиша.

export const GUIDE_INTRO: GuideIntro = {
  title: 'Корзинка',
  lead: 'Собирай игру по кусочкам: выполняй квесты по порядку и жми «Собрать», чтобы увидеть, что получилось.',
  tips: ['[[Ctrl]] + [[Enter]] — собрать', '[[Ctrl]] + [[Z]] — отменить правку', 'Клик по экрану, потом [[←]] [[→]]'],
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    step: 1,
    pic: 'улыбка',
    tab: 1,
    title: 'Герой',
    lead: 'Создай героя-картинку, нарисуй его и научи ездить стрелками.',
    how: [
      'Движок 60 раз в секунду вызывает `drawPlayer()` и `movePlayer()`.',
      'Готовая функция движка `drawPic` рисует картинку в точке `playerX`, `playerY`: низ картинки — на высоте `playerY`.',
      'Зажата `ArrowLeft` — уменьшаем `playerX`, `ArrowRight` — увеличиваем на `playerSpeed`.',
    ],
    code: STEP_HERO,
    checks: ['Герой ездит от [[←]] и [[→]]', 'И не уезжает за край'],
    fns: ['drawPlayer', 'movePlayer'],
    quests: [HERO_CREATE_TASK, HERO_PICK_TASK, HERO_DRAW_TASK, HERO_RUN_TASK, HERO_MOVE_TASK, SPEED_TASK],
  },
  {
    step: 2,
    pic: 'яблоко',
    tab: 2,
    title: 'Яблоки падают',
    lead: 'Раз в секунду сверху появляется яблоко и летит вниз.',
    how: [
      'Яблоки лежат в массиве `items`, у каждого есть `x` и `y`.',
      'Раз в `spawnEvery` кадров появляется новое, а цикл `for` прибавляет каждому `fallSpeed`.',
      'Сквозь героя они пока пролетают — поимка будет в шаге 3.',
    ],
    code: STEP_APPLES,
    checks: ['Яблоки падают', 'В «Приборах» растёт `items`'],
    fns: ['moveItems', 'drawItems'],
    quests: [ITEMS_MOVE_TASK, ITEMS_DRAW_TASK, FALL_SPEED_TASK, SPEEDUP_TASK],
  },
  {
    step: 3,
    pic: 'корзинка',
    tab: 3,
    title: 'Поймал или уронил',
    lead: 'Поймал — очко, уронил — минус жизнь.',
    how: [
      'Яблоко рядом с героем и опустилось до него — поймано: `score` растёт.',
      'Улетело ниже поля (`y > 500`) — минус жизнь.',
      'Цикл идёт с конца: `items.splice` вырезает яблоко и сдвигает остальные.',
    ],
    code: STEP_CATCH,
    checks: ['Поймал — счёт растёт', 'Три промаха — «Игра окончена»'],
    fns: ['checkCatch'],
    quests: [CATCH_TASK, TEN_POINTS_TASK],
  },
]

export const GUIDE_EXTRAS: GuideExtra[] = [
  {
    n: 4,
    pic: 'бомба',
    title: 'Бомба',
    text: 'Поймал бомбу — минус жизнь. Упустить не страшно.',
    quests: BOMB_QUESTS,
  },
  {
    n: 5,
    pic: 'звезда',
    title: 'Звезда',
    text: 'Поймал звезду — плюс жизнь. Откроется после бомбы.',
    quests: GOLD_QUESTS,
  },
]
