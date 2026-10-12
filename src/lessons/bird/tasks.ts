import {
  after,
  createPicQuest,
  drawPicQuest,
  has,
  into,
  numberQuest,
  pickColorQuest,
  pickPicQuest,
  runQuest,
  settingVar,
  shell,
} from '../kit.ts'
import type { BuildTask } from '../types.ts'
import { BIRD_PIC, FLAP_LINE, GRAVITY_LINE, PIPE_COLOR, PIPE_COLOR_LINE, PIPE_SPEED_LINE } from './tabs.ts'

// Квесты Птички. Код шага собирается кнопками «Добавить» по кусочкам и в итоге совпадает с STEP_* из tabs.ts.

// ===== Шаг 1. Птица: создать → выбрать → нарисовать → собрать → падение → гравитация =====

export const BIRD_CREATE_TASK = createPicQuest({
  title: 'Создай птицу',
  text: 'Птица — это картинка. Открой «Птица»: там всплывёт строчка с ней — жми «Добавить».',
  tab: 1,
  name: 'birdPic',
  pic: BIRD_PIC,
  piece: 'Картинка птицы',
  comment: 'птица — любая картинка',
  doneText: 'Птица создана! Теперь нажми «Сменить» рядом с картинкой и выбери, кто полетит.',
})

export const BIRD_PICK_TASK = pickPicQuest({
  title: 'Выбери птицу',
  text: `Сейчас летит ${BIRD_PIC}. Нажми «Сменить» рядом с картинкой и выбери, кто полетит, — например, сова или пчела.`,
  tab: 1,
  name: 'birdPic',
  pic: BIRD_PIC,
  hint: `Это строка \`var birdPic = "${BIRD_PIC}";\` во вкладке «Птица». Кнопка «Сменить» — прямо рядом с ней. Можно и напечатать имя картинки между кавычками самому: "сова", "пчела", "дракон".`,
})

export const BIRD_DRAW_TASK = drawPicQuest({
  title: 'Нарисуй птицу',
  text: 'Движок 60 раз в секунду зовёт `drawBird()`. Собери её по кусочкам — кнопки «Добавить» всплывут в «Птице».',
  tab: 1,
  fn: 'drawBird',
  pic: 'birdPic',
  x: 'birdX',
  y: 'birdY',
  doneText: 'Все кусочки птицы на месте!',
})

export const BIRD_RUN_TASK = runQuest({
  title: 'Собери игру',
  text: 'Нажми «Собрать» или [[Ctrl]] + [[Enter]] — птица появится на экране.',
  callout: 'Птица нарисована! Нажми «Собрать» — и она появится на экране.',
  doneText: 'Вот твоя птица!',
  after: [BIRD_DRAW_TASK],
})

const GRAVITY_STEP = /\bspeedY\s*(=\s*speedY\s*\+|\+=)\s*gravity\b/
const SPEED_STEP = /\bbirdY\s*(=\s*birdY\s*\+|\+=)\s*speedY\b/

export const BIRD_FALL_TASK: BuildTask = {
  kind: 'build',
  title: 'Птица падает',
  text: 'Движок зовёт и `moveBird()`. Тут новое: у птицы есть скорость `speedY`. Гравитация прибавляется к скорости, а скорость — к высоте `birdY`.',
  tab: 1,
  pieces: [
    settingVar('Гравитация', 'gravity', GRAVITY_LINE()),
    shell('moveBird'),
    {
      title: 'Гравитация прибавляется к скорости',
      plan: into('moveBird', '  // гравитация разгоняет птицу вниз\n  speedY = speedY + gravity;'),
      isDone: (code) => has(code, GRAVITY_STEP),
    },
    {
      title: 'Скорость прибавляется к высоте',
      plan: into('moveBird', '  // скорость двигает птицу\n  birdY = birdY + speedY;'),
      isDone: (code) => has(code, SPEED_STEP),
    },
    {
      title: 'Не падать ниже экрана и не улетать выше неба',
      plan: into(
        'moveBird',
        '\n  // не даём птице упасть ниже экрана и улететь выше неба\n  if (birdY > 460) {\n    birdY = 460;\n    speedY = 0;\n  }\n  if (birdY < 30) {\n    birdY = 30;\n    speedY = 0;\n  }',
      ),
      isDone: (code) => has(code, /\bif\s*\(\s*birdY\s*>\s*460\s*\)/) && has(code, /\bif\s*\(\s*birdY\s*<\s*30\s*\)/),
    },
  ],
  doneText: 'Падение готово! Но птица пока висит: гравитация gravity — 0. Следующий квест — в «Гайде».',
}

export const GRAVITY_TASK = numberQuest({
  title: 'Включи гравитацию',
  text: 'Птица висит, потому что гравитация `gravity` — 0. Она тут же, в «Птице», над `moveBird`. Поставь 0.4, нажми «Собрать», потом пробел — и птица полетит вниз.',
  tab: 1,
  name: 'gravity',
  hint: 'Это строка `var gravity = 0;` во вкладке «Птица». Дробные числа пишутся через точку: `0.4`. Каждый кадр скорость падения растёт на это число — птица падает всё быстрее, как настоящий камень.',
})

// ===== Шаг 2. Взмах: собрать flap → сила взмаха =====

export const FLAP_TASK: BuildTask = {
  kind: 'build',
  title: 'Взмах',
  text: 'Пробел зовёт `flap()`. Взмах не двигает птицу сам — он даёт ей скорость вверх, а дальше её снова тянет гравитация.',
  tab: 2,
  pieces: [
    settingVar('Сила взмаха', 'flapPower', FLAP_LINE()),
    shell('flap'),
    {
      title: 'Скорость — вверх',
      plan: into('flap', '  // взмах: скорость сразу вверх (вверх — это минус)\n  speedY = -flapPower;'),
      isDone: (code) => has(code, /\bspeedY\s*=\s*-\s*flapPower\b/),
    },
  ],
  doneText: 'Взмах готов! Но птица не подлетает: сила взмаха flapPower — 0. Следующий квест — в «Гайде».',
}

export const FLAP_POWER_TASK = numberQuest({
  title: 'Сила взмаха',
  text: 'Сила взмаха `flapPower` — 0, поэтому взмах ничего не делает. Она тут же, во «Взмахе», над `flap`. Поставь 7, нажми «Собрать» и держи птицу в воздухе пробелом.',
  tab: 2,
  name: 'flapPower',
  hint: 'Это строка `var flapPower = 0;` во вкладке «Взмах». Чем больше число, тем выше подлетает птица: 5 — чуть-чуть, 10 — до самого неба.',
})

// ===== Шаг 3. Трубы: едут → рисуются → скорость → свой цвет =====

const FRAME_TICK = /\bframe\s*=\s*frame\s*\+\s*1\s*;/

export const PIPES_MOVE_TASK: BuildTask = {
  kind: 'build',
  title: 'Трубы едут',
  text: 'Собери `movePipes()` в «Трубах»: раз в полторы секунды справа появляется труба с дыркой, и все трубы едут влево.',
  tab: 3,
  pieces: [
    settingVar('Скорость труб', 'pipeSpeed', PIPE_SPEED_LINE()),
    shell('movePipes'),
    {
      title: 'Считать кадры',
      plan: into('movePipes', '  frame = frame + 1;'),
      isDone: (code) => has(code, FRAME_TICK),
    },
    {
      title: 'Новая труба с дыркой на случайной высоте',
      plan: into(
        'movePipes',
        '\n  // раз в pipeEvery кадров — новая труба справа, дырка на случайной высоте\n  if (frame % pipeEvery === 0) {\n    pipes.push({ x: 380, top: 60 + Math.random() * 200, passed: false });\n  }',
      ),
      isDone: (code) => has(code, /\bpipes\.push\s*\(/),
    },
    {
      title: 'Все трубы едут влево',
      plan: into(
        'movePipes',
        '\n  // все трубы едут влево\n  for (var i = 0; i < pipes.length; i++) {\n    pipes[i].x = pipes[i].x - pipeSpeed;\n  }',
      ),
      isDone: (code) => has(code, /(-|-=)\s*pipeSpeed\b/),
    },
    {
      title: 'Убрать трубу за левым краем',
      plan: into(
        'movePipes',
        '\n  // труба уехала за левый край — убираем её\n  if (pipes.length > 0 && pipes[0].x < -60) {\n    pipes.shift();\n  }',
      ),
      isDone: (code) => has(code, /\bpipes\.shift\s*\(/),
    },
  ],
  doneText: 'Трубы появляются! В «Приборах» растёт pipes. Но их пока не видно — дальше нарисуем.',
}

/** Труба в цикле по трубам: `var p = pipes[i];` — и в drawPipes, и в checkHit. */
const VAR_P = /\bvar\s+p\s*=\s*pipes\s*\[\s*i\s*\]/
const TOP_PIPE = /\bdrawPipe\s*\(\s*p\.x\s*,\s*0\s*,/

export const PIPES_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Нарисуй трубы',
  text: 'Собери `drawPipes()`: у каждой трубы две части — над дыркой и под ней. Красивую трубу с шапкой рисует готовая функция движка `drawPipe(x, откуда, докуда)`.',
  tab: 3,
  pieces: [
    settingVar('Цвет труб', 'pipeColor', PIPE_COLOR_LINE()),
    shell('drawPipes'),
    {
      title: 'Перебрать все трубы',
      plan: into('drawPipes', '  for (var i = 0; i < pipes.length; i++) {\n    var p = pipes[i];\n  }'),
      isDone: (code) => has(code, VAR_P),
    },
    {
      title: 'Верхняя труба — от неба до дырки',
      plan: (code) =>
        after(code, VAR_P, '    // верхняя труба — до дырки, нижняя — после неё\n    drawPipe(p.x, 0, p.top);'),
      isDone: (code) => has(code, TOP_PIPE),
    },
    {
      title: 'Нижняя труба — от дырки до низа экрана',
      plan: (code) => after(code, TOP_PIPE, '    drawPipe(p.x, p.top + pipeGap, 470);'),
      isDone: (code) => has(code, /\bdrawPipe\s*\([^)]*pipeGap/),
    },
  ],
  doneText: 'Трубы нарисованы! Но они стоят за правым краем: их скорость pipeSpeed — 0. Следующий квест — в «Гайде».',
}

export const PIPE_SPEED_TASK = numberQuest({
  title: 'Скорость труб',
  text: 'Трубы появляются за правым краем, но стоят: их скорость `pipeSpeed` — 0. Она тут же, в «Трубах», над `movePipes`. Поставь 2, нажми «Собрать» — и они поедут навстречу.',
  tab: 3,
  name: 'pipeSpeed',
  hint: 'Это строка `var pipeSpeed = 0;` во вкладке «Трубы». Это сколько пикселей труба проезжает за кадр. 2 — в самый раз, 4 — очень трудно.',
})

export const PIPE_COLOR_TASK = pickColorQuest({
  title: 'Цвет труб',
  text: 'Трубы зелёные, потому что так написано в `pipeColor` — тут же, в «Трубах», над `drawPipes`. Нажми «Сменить» рядом с цветом и выбери свой, потом «Собрать».',
  tab: 3,
  name: 'pipeColor',
  color: PIPE_COLOR,
  hint: `Это строка \`var pipeColor = "${PIPE_COLOR}";\` во вкладке «Трубы». Кнопка «Сменить» с квадратиком цвета — прямо рядом с ней. Можно напечатать и название цвета по-английски: "red", "gold", "pink".`,
})

// ===== Шаг 4. Удар: собрать checkHit → очко за трубу =====

const HIT_LOOP = /\bfor\s*\(\s*var\s+i\s*=\s*0\s*;\s*i\s*<\s*pipes\.length\b/
const RYADOM = /\bvar\s+ryadom\s*=/

export const HIT_TASK: BuildTask = {
  kind: 'build',
  title: 'Врезался — конец игры',
  text: 'Собери `checkHit()` в «Ударе»: ударилась о низ экрана или задела трубу — `gameOver = true`, и движок останавливает игру.',
  tab: 4,
  pieces: [
    shell('checkHit'),
    {
      title: 'Ударилась о низ — конец игры',
      plan: into('checkHit', '  // ударился о низ экрана — конец игры\n  if (birdY >= 460) gameOver = true;'),
      isDone: (code) => has(code, /\bif\s*\(\s*birdY\s*>=\s*460\s*\)/),
    },
    {
      title: 'Перебрать все трубы',
      plan: into('checkHit', '\n  for (var i = 0; i < pipes.length; i++) {\n    var p = pipes[i];\n  }'),
      isDone: (code) => has(code, HIT_LOOP) && has(code, VAR_P),
    },
    {
      title: 'Птица над трубой?',
      plan: (code) =>
        after(
          code,
          VAR_P,
          '\n    // птица над трубой по горизонтали?\n    var ryadom = birdX + 34 > p.x && birdX < p.x + 52;',
        ),
      isDone: (code) => has(code, RYADOM),
    },
    {
      title: 'Задела трубу — конец игры',
      plan: (code) =>
        after(
          code,
          RYADOM,
          '\n    if (ryadom && (birdY - 26 < p.top || birdY > p.top + pipeGap)) {\n      // врезался в трубу — конец игры\n      gameOver = true;\n    }',
        ),
      isDone: (code) => has(code, /\bif\s*\(\s*ryadom\b/),
    },
  ],
  doneText: 'Столкновения готовы! Нажми «Собрать» и попробуй пролететь в дырку.',
}

export const SCORE_TASK: BuildTask = {
  kind: 'build',
  title: 'Очко за трубу',
  text: 'Пролетела трубу — плюс очко. Чтобы одна труба не дала очко дважды, запоминаем у неё `passed = true`.',
  tab: 4,
  pieces: [
    {
      title: 'Пролетел трубу — плюс очко',
      plan: (code) =>
        after(
          code,
          VAR_P,
          '\n    // пролетел трубу — плюс очко\n    if (!p.passed && p.x + 52 < birdX) {\n      p.passed = true;\n      score = score + 1;\n    }',
        ),
      isDone: (code) => has(code, /\bp\.passed\s*=\s*true\b/) && has(code, /\bscore\s*(=\s*score\s*\+|\+=)/),
    },
  ],
  doneText: 'Счёт готов! Нажми «Собрать» — сколько труб пролетишь?',
}
