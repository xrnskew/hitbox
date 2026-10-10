import type { GuideExtra, GuideIntro, GuideStep } from '../types.ts'
import { BOOM_QUESTS, WAVES_QUESTS } from './bonus.ts'
import { STEP_BULLETS, STEP_ENEMIES, STEP_HITS, STEP_SHIP } from './tabs.ts'
import {
  BEAM_RUN_TASK,
  BREACH_TASK,
  BULLET_COLOR_TASK,
  BULLET_SPEED_TASK,
  BULLETS_DRAW_TASK,
  BULLETS_MOVE_TASK,
  ENEMIES_DRAW_TASK,
  ENEMY_PICK_TASK,
  ENEMY_SPEED_TASK,
  HITS_TASK,
  RELOAD_TASK,
  RELOAD_TIME_TASK,
  SCORE_TASK,
  SHIP_CREATE_TASK,
  SHIP_DRAW_TASK,
  SHIP_MOVE_TASK,
  SHIP_PICK_TASK,
  SHIP_RUN_TASK,
  SHIP_SPEED_TASK,
  SHOOT_TASK,
  WAVE_TASK,
  ZIGZAG_TASK,
} from './tasks.ts'

// Тон тот же, что в Корзинке и Птичке: для подростка, коротко, на «ты». Это сложная игра, и новые мысли
// в ней три: второй массив (пули рядом с пришельцами), цикл в цикле и перезарядка — счётчик, который
// каждый кадр уменьшается до нуля.

export const GUIDE_INTRO: GuideIntro = {
  title: 'Космос',
  lead: 'Корабль внизу, сверху волнами летят пришельцы. Стреляй и не дай им долететь. Собирай игру по квестам и жми «Собрать».',
  tips: [
    '[[Ctrl]] + [[Enter]] — собрать',
    '[[Ctrl]] + [[Z]] — отменить правку',
    'Клик по экрану, потом [[←]] [[→]] и [[Пробел]]',
  ],
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    step: 1,
    pic: 'ракета',
    tab: 1,
    title: 'Корабль',
    lead: 'Создай корабль-картинку, нарисуй его и научи летать стрелками.',
    how: [
      'Движок 60 раз в секунду вызывает `drawShip()` и `moveShip()`.',
      'Это как герой в Корзинке: стрелка зажата — к `shipX` прибавляется или отнимается `shipSpeed`.',
      'Корабль шириной 34 пикселя, поле — 380. Поэтому `shipX` не меньше 0 и не больше 340.',
    ],
    code: STEP_SHIP,
    checks: ['Корабль внизу экрана', 'Стрелки ← → двигают его', 'За край не улетает'],
    fns: ['drawShip', 'moveShip'],
    quests: [SHIP_CREATE_TASK, SHIP_PICK_TASK, SHIP_DRAW_TASK, SHIP_RUN_TASK, SHIP_MOVE_TASK, SHIP_SPEED_TASK],
  },
  {
    step: 2,
    pic: 'комета',
    tab: 2,
    title: 'Пули',
    lead: 'Пробел — выстрел. Пули летят вверх, а между выстрелами — перезарядка.',
    how: [
      'Пули — второй массив, `bullets`. Пробел добавляет в него пулю, `moveBullets` двигает все пули вверх, а улетевшую за край убирает `shift()`.',
      'Без перезарядки пуля вылетает каждый кадр — 60 в секунду, получается сплошной луч.',
      'Перезарядка — счётчик `reload`. Выстрелил — в него кладётся `reloadTime`, потом каждый кадр он уменьшается на 1. Пока он не 0, `return` выходит из `shoot` до выстрела.',
    ],
    code: STEP_BULLETS,
    checks: ['Пробел — пули летят вверх', 'Держишь пробел — очередь, а не луч', 'Пули твоего цвета'],
    fns: ['shoot', 'moveBullets', 'drawBullets'],
    quests: [
      SHOOT_TASK,
      BULLETS_MOVE_TASK,
      BULLETS_DRAW_TASK,
      BULLET_SPEED_TASK,
      BEAM_RUN_TASK,
      RELOAD_TASK,
      RELOAD_TIME_TASK,
      BULLET_COLOR_TASK,
    ],
  },
  {
    step: 3,
    pic: 'пришелец',
    tab: 3,
    title: 'Пришельцы',
    lead: 'Сверху волнами летят пришельцы — вниз и зигзагом. Кончились — летит новая волна.',
    how: [
      'Пришельцы — массив `enemies`. Когда он пустой, цикл `for` добавляет сразу `waveSize` пришельцев — целую волну. Движок замечает, что `wave` выросла, и крупно пишет «Волна 2».',
      'Каждый — в случайном месте по `x`, а по `y` каждый следующий выше на 60. Поэтому они залетают на экран и долетают до корабля по одному, а не все разом.',
      'У каждого пришельца своя скорость вбок — `dx`, как `speedY` у птицы, только у каждого своя. Долетел до края — `dx = -dx`, и он летит обратно.',
      'Пришельцы пока пролетают сквозь пули — попадания будут в шаге 4.',
    ],
    code: STEP_ENEMIES,
    checks: ['Сверху «Волна 1» и пришельцы', 'Они спускаются и мечутся зигзагом', 'Номер волны — слева сверху'],
    fns: ['moveEnemies', 'drawEnemies'],
    quests: [WAVE_TASK, ENEMIES_DRAW_TASK, ENEMY_SPEED_TASK, ZIGZAG_TASK, ENEMY_PICK_TASK],
  },
  {
    step: 4,
    pic: 'взрыв',
    tab: 4,
    title: 'Попадание',
    lead: 'Пуля попала в пришельца — он сбит. Долетел до корабля — минус жизнь.',
    how: [
      'Чтобы найти попадания, надо проверить каждую пару «пришелец и пуля». Поэтому цикл в цикле: для каждого пришельца `a` перебираем все пули `b`.',
      'Оба цикла идут с конца, как в Корзинке: `splice` сдвигает массив, и с начала следующий элемент проскочил бы.',
      '`break` выходит из цикла по пулям: пришельца уже нет, и другие пули его не проверяют — иначе одна цель дала бы два очка.',
      'Второй цикл — новый, `i` в нём начинается заново. Пришелец ниже `shipY - 10` долетел — минус жизнь. Жизней 0 — «Игра окончена».',
    ],
    code: STEP_HITS,
    checks: ['Попал — пришелец и пуля пропадают, счёт растёт', 'Пришелец долетел — минус жизнь'],
    fns: ['checkHits'],
    quests: [HITS_TASK, SCORE_TASK, BREACH_TASK],
  },
]

export const GUIDE_EXTRAS: GuideExtra[] = [
  {
    n: 5,
    pic: 'взрыв',
    title: 'Взрывы',
    text: 'Сбил пришельца — на его месте 20 кадров горит взрыв. Взрывы — третий массив, `booms`.',
    quests: BOOM_QUESTS,
  },
  {
    n: 6,
    pic: 'пришелец',
    title: 'Волна за волной',
    text: 'Каждая новая волна на одного пришельца больше и быстрее прошлой, но не быстрее `maxSpeed`. Откроется после взрывов.',
    quests: WAVES_QUESTS,
  },
]
