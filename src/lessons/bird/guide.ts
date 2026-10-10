import type { GuideExtra, GuideIntro, GuideStep } from '../types.ts'
import { COIN_QUESTS, SPEEDUP_QUESTS } from './bonus.ts'
import { STEP_BIRD, STEP_FLAP, STEP_HIT, STEP_PIPES } from './tabs.ts'
import {
  BIRD_CREATE_TASK,
  BIRD_DRAW_TASK,
  BIRD_FALL_TASK,
  BIRD_PICK_TASK,
  BIRD_RUN_TASK,
  FLAP_POWER_TASK,
  FLAP_TASK,
  GRAVITY_TASK,
  HIT_TASK,
  PIPE_COLOR_TASK,
  PIPE_SPEED_TASK,
  PIPES_DRAW_TASK,
  PIPES_MOVE_TASK,
  SCORE_TASK,
} from './tasks.ts'

// Тон тот же, что в «Корзинке»: для подростка, коротко, на «ты». Главная новая мысль урока — скорость:
// гравитация меняет скорость, скорость меняет высоту, а взмах просто задаёт скорость вверх.

export const GUIDE_INTRO: GuideIntro = {
  title: 'Птичка',
  lead: 'Птица падает, пробел — взмах, навстречу едут трубы с дыркой. Собирай игру по квестам и жми «Собрать».',
  tips: ['[[Ctrl]] + [[Enter]] — собрать', '[[Ctrl]] + [[Z]] — отменить правку', 'Клик по экрану, потом [[Пробел]]'],
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    step: 1,
    pic: 'цыплёнок',
    tab: 1,
    title: 'Птица',
    lead: 'Создай птицу-картинку, нарисуй её и включи гравитацию.',
    how: [
      'Движок 60 раз в секунду вызывает `drawBird()` и `moveBird()`.',
      'В «Корзинке» герой сдвигался на одно и то же число. Здесь у птицы есть скорость `speedY`: каждый кадр к ней прибавляется `gravity`, а сама скорость прибавляется к `birdY`.',
      'Поэтому птица падает всё быстрее. Вниз — это плюс: у холста `y` растёт сверху вниз.',
    ],
    code: STEP_BIRD,
    checks: ['После пробела птица падает всё быстрее', 'И останавливается внизу экрана'],
    fns: ['drawBird', 'moveBird'],
    quests: [BIRD_CREATE_TASK, BIRD_PICK_TASK, BIRD_DRAW_TASK, BIRD_RUN_TASK, BIRD_FALL_TASK, GRAVITY_TASK],
  },
  {
    step: 2,
    pic: 'птичка',
    tab: 2,
    title: 'Взмах',
    lead: 'Пробел — взмах: птица подлетает, а потом снова падает.',
    how: [
      'Пробел, стрелка вверх или клик по экрану зовут `flap()`.',
      '`speedY = -flapPower` — скорость сразу становится «вверх». Минус, потому что вверх — это меньше `y`.',
      'Дальше гравитация каждый кадр гасит эту скорость, и птица снова падает. Получается дуга.',
    ],
    code: STEP_FLAP,
    checks: ['Пробел — птица подлетает', 'Частые взмахи держат её в воздухе'],
    fns: ['flap'],
    quests: [FLAP_TASK, FLAP_POWER_TASK],
  },
  {
    step: 3,
    pic: 'труба',
    tab: 3,
    title: 'Трубы',
    lead: 'Справа появляются трубы с дыркой и едут навстречу.',
    how: [
      'Трубы лежат в массиве `pipes`, у каждой есть `x` и `top` — где начинается дырка.',
      'Раз в `pipeEvery` кадров появляется новая, а цикл `for` отнимает у каждой `pipeSpeed`.',
      'Верхняя часть — от 0 до `top`, нижняя — от `top + pipeGap` до низа экрана. Красивую трубу с шапкой рисует готовая `drawPipe` цветом `pipeColor`.',
      'Птица пока пролетает сквозь трубы — удар будет в шаге 4.',
    ],
    code: STEP_PIPES,
    checks: ['Трубы едут справа налево', 'Дырка каждый раз на новой высоте', 'Трубы твоего цвета'],
    fns: ['movePipes', 'drawPipes'],
    quests: [PIPES_MOVE_TASK, PIPES_DRAW_TASK, PIPE_SPEED_TASK, PIPE_COLOR_TASK],
  },
  {
    step: 4,
    pic: 'звезда',
    tab: 4,
    title: 'Удар и счёт',
    lead: 'Врезался — конец игры, пролетел трубу — очко.',
    how: [
      'Птица задела трубу, если она над трубой по горизонтали (`ryadom`) и при этом выше дырки или ниже неё.',
      '`gameOver = true` — движок перестаёт двигать птицу и трубы и пишет «Игра окончена».',
      'Труба уехала левее птицы — очко. Флаг `passed` не даёт посчитать одну трубу дважды.',
    ],
    code: STEP_HIT,
    checks: ['Задел трубу или низ экрана — «Игра окончена»', 'Пролетел трубу — счёт растёт'],
    fns: ['checkHit'],
    quests: [HIT_TASK, SCORE_TASK],
  },
]

export const GUIDE_EXTRAS: GuideExtra[] = [
  {
    n: 5,
    pic: 'монетка',
    title: 'Монетки',
    text: 'В половине дырок висит монетка. Схватил — плюс 5 очков.',
    quests: COIN_QUESTS,
  },
  {
    n: 6,
    pic: 'молния',
    title: 'Всё быстрее',
    text: 'Каждые 10 секунд трубы едут быстрее, но не быстрее `maxSpeed`. Откроется после монеток.',
    quests: SPEEDUP_QUESTS,
  },
]
