import { DRAW_PIC } from '../engine.ts'
import type { LessonVariant, TabDef } from '../types.ts'

// Птичка (как Flappy Bird). Новое по сравнению с «Корзинкой» — скорость, а не только позиция:
// гравитация каждый кадр прибавляется к скорости speedY, а скорость — к высоте birdY.
// Гравитация, сила взмаха и скорость труб в учебном движке — 0: их ученик ставит сам в квестах.
// Строк coinPic и maxSpeed нет: их ученик добавляет в дополнительных заданиях. Птицу и монетки рисует
// готовая функция drawPic — картинками из набора HitBox.
// Красивую трубу (шапка, блик, тень) рисует готовая функция движка drawPipe цветом pipeColor —
// цвет ученик выбирает сам в квесте «Цвет труб».
export const PIPE_COLOR = '#5ec639'

export const TUTORIAL_ENGINE = `// ===== НАСТРОЙКИ =====
var gravity   = 0;
var flapPower = 0;
var pipeSpeed = 0;
var pipeGap   = 150;
var pipeEvery = 90;
var pipeColor = "${PIPE_COLOR}";

// ===== СОСТОЯНИЕ ИГРЫ =====
var birdX = 80;
var birdY = 220;
var speedY = 0;
var pipes = [];
var score = 0;
var frame = 0;
var started = false;
var gameOver = false;

// ===== КЛАВИШИ =====
// пробел, стрелка вверх или клик по экрану — взмах
function press() {
  started = true;
  if (!gameOver) flap();
}
document.addEventListener("keydown", function (e) {
  if ((e.key === " " || e.key === "ArrowUp") && !e.repeat) press();
});
canvas.addEventListener("pointerdown", press);

// ===== ЗАГОТОВКИ =====
// Пока пустые. Твои функции из других вкладок их заменят.
function drawBird()  {}
function moveBird()  {}
function flap()      {}
function movePipes() {}
function drawPipes() {}
function checkHit()  {}

${DRAW_PIC}

// ===== ТРУБА =====
// Рисует трубу цветом pipeColor от y = from до y = to.
// Шапка — с того конца, который смотрит на дырку.
function drawPipe(x, from, to) {
  // save и restore: после трубы кисточка станет как была,
  // а не полупрозрачной, как у тени
  ctx.save();
  var capY = from <= 0 ? to - 24 : from;
  pipePart(x, from, 52, to - from);
  pipePart(x - 4, capY, 60, 24);
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(x - 4, capY, 60, 3);
  ctx.fillRect(x - 4, capY + 21, 60, 3);
  ctx.restore();
}

// кусок трубы: цвет, блик слева и тень справа — так труба выглядит круглой
function pipePart(x, y, w, h) {
  ctx.fillStyle = pipeColor;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.fillRect(x + w * 0.14, y, w * 0.16, h);
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(x + w * 0.7, y, w * 0.3, h);
}

// ===== ГЛАВНЫЙ ЦИКЛ =====
function loop() {
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, 380, 470);

  if (started && !gameOver) {
    moveBird();
    movePipes();
    checkHit();
  }
  drawPipes();
  drawBird();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 17px sans-serif";
  ctx.fillText("Счёт: " + score, 12, 26);

  if (!started) {
    ctx.font = "bold 20px sans-serif";
    ctx.fillText("Жми пробел!", 128, 320);
  }
  if (gameOver) {
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("Игра окончена", 78, 240);
  }
  requestAnimationFrame(loop);
}
loop();`

export const COIN_LINE = 'var coinPic = "монетка";'
export const MAX_SPEED_LINE = 'var maxSpeed  = 5;'

// ===== Код шагов гайда — базовая версия: без монеток, скорость труб постоянная =====
// Каждый шаг собирается кнопками по кусочкам (tasks.ts) и в итоге совпадает с этим кодом.

/** Смайлик птицы, с которого начинают. Квест «Выбери птицу» — поменять его на свой. */
export const BIRD_PIC = 'цыплёнок'

export const STEP_BIRD = `// птица — любая картинка
var birdPic = "${BIRD_PIC}";

function drawBird() {
  drawPic(birdPic, birdX, birdY);
}

function moveBird() {
  // гравитация разгоняет птицу вниз
  speedY = speedY + gravity;
  // скорость двигает птицу
  birdY = birdY + speedY;

  // не даём птице упасть ниже экрана и улететь выше неба
  if (birdY > 460) {
    birdY = 460;
    speedY = 0;
  }
  if (birdY < 30) {
    birdY = 30;
    speedY = 0;
  }
}`

export const STEP_FLAP = `function flap() {
  // взмах: скорость сразу вверх (вверх — это минус)
  speedY = -flapPower;
}`

const MOVE_PIPES = (push: string, extra = '') => `function movePipes() {
  frame = frame + 1;${extra}

  // раз в pipeEvery кадров — новая труба справа, дырка на случайной высоте
  if (frame % pipeEvery === 0) {
    pipes.push(${push});
  }

  // все трубы едут влево
  for (var i = 0; i < pipes.length; i++) {
    pipes[i].x = pipes[i].x - pipeSpeed;
  }

  // труба уехала за левый край — убираем её
  if (pipes.length > 0 && pipes[0].x < -60) {
    pipes.shift();
  }
}`

const DRAW_PIPES = (coin = '') => `function drawPipes() {
  for (var i = 0; i < pipes.length; i++) {
    var p = pipes[i];
    // верхняя труба — до дырки, нижняя — после неё
    drawPipe(p.x, 0, p.top);
    drawPipe(p.x, p.top + pipeGap, 470);${coin}
  }
}`

export const STEP_PIPES = `${MOVE_PIPES('{ x: 380, top: 60 + Math.random() * 200, passed: false }')}

${DRAW_PIPES()}`

const CHECK_HIT = (coin = '') => `function checkHit() {
  // ударился о низ экрана — конец игры
  if (birdY >= 460) gameOver = true;

  for (var i = 0; i < pipes.length; i++) {
    var p = pipes[i];

    // пролетел трубу — плюс очко
    if (!p.passed && p.x + 52 < birdX) {
      p.passed = true;
      score = score + 1;
    }
${coin}
    // птица над трубой по горизонтали?
    var ryadom = birdX + 34 > p.x && birdX < p.x + 52;

    if (ryadom && (birdY - 26 < p.top || birdY > p.top + pipeGap)) {
      // врезался в трубу — конец игры
      gameOver = true;
    }
  }
}`

export const STEP_HIT = CHECK_HIT()

// ===== Монетки и «Всё быстрее»: основа — код после всех шагов =====

export const COIN_PUSH = '{ x: 380, top: 60 + Math.random() * 200, passed: false, coin: Math.random() < 0.5 }'

export const COIN_DRAW = `

    // монетка — посередине дырки
    if (p.coin) {
      drawPic(coinPic, p.x + 9, p.top + pipeGap / 2 + 12);
    }`

export const COIN_PIPES = `${MOVE_PIPES(COIN_PUSH)}

${DRAW_PIPES(COIN_DRAW)}`

export const COIN_GRAB = `
    // схватил монетку — плюс 5 очков
    if (p.coin && Math.abs(birdX - (p.x + 9)) < 30 && Math.abs(birdY - (p.top + pipeGap / 2 + 12)) < 30) {
      p.coin = false;
      score = score + 5;
    }`

export const COIN_HIT = CHECK_HIT(`${COIN_GRAB}\n`)

export const SPEEDUP_FN = `// каждые 10 секунд трубы едут быстрее, но не быстрее maxSpeed
function speedUp() {
  if (frame % 600 === 0 && pipeSpeed < maxSpeed) {
    pipeSpeed = pipeSpeed + 0.5;
  }
}`

export const FAST_PIPES = `${MOVE_PIPES(COIN_PUSH, '\n  speedUp();')}

${DRAW_PIPES(COIN_DRAW)}

${SPEEDUP_FN}`

// ===== Готовая версия (?finished): монетки, ускорение, всё настроено =====

const FINISHED_ENGINE = TUTORIAL_ENGINE.replace('var gravity   = 0;', 'var gravity   = 0.4;')
  .replace('var flapPower = 0;', 'var flapPower = 7;')
  .replace('var pipeSpeed = 0;', 'var pipeSpeed = 2;')
  .replace('// ===== НАСТРОЙКИ =====', `// ===== НАСТРОЙКИ =====\n${COIN_LINE}\n${MAX_SPEED_LINE}`)

const FINISHED_BIRD = STEP_BIRD.replace(`"${BIRD_PIC}"`, '"птичка"')

// ===== Вкладки =====

const placeholder = (step: number, what: string) =>
  `// Шаг ${step}. ${what}\n// Не знаешь, с чего начать? Открой вкладку «Гайд».`

export const TUTORIAL_TABS: TabDef[] = [
  {
    id: 'engine',
    title: 'Движок',
    note: 'Готовый движок: настройки, состояние игры и главный цикл. Настройки сверху можно менять.',
  },
  {
    id: 'bird',
    title: 'Птица',
    step: 1,
    note: 'Шаг 1: птица — картинка. Гравитация разгоняет её вниз.',
  },
  { id: 'flap', title: 'Взмах', step: 2, note: 'Шаг 2: пробел — взмах, птица подлетает вверх.' },
  { id: 'pipes', title: 'Трубы', step: 3, note: 'Шаг 3: трубы с дыркой едут навстречу птице.' },
  { id: 'hit', title: 'Удар', step: 4, note: 'Шаг 4: врезался — конец игры, пролетел трубу — очко.' },
]

export const TUTORIAL_CODES: string[] = [
  TUTORIAL_ENGINE,
  placeholder(1, 'Здесь будет твоя птица: картинка, drawBird и moveBird.'),
  placeholder(2, 'Здесь будет функция flap — взмах.'),
  placeholder(3, 'Здесь будут функции movePipes и drawPipes.'),
  placeholder(4, 'Здесь будет функция checkHit.'),
]

export const FINISHED_TABS: TabDef[] = [
  { id: 'engine', title: 'Движок', note: 'Настройки, состояние игры и главный цикл. Числа и картинки можно менять.' },
  { id: 'bird', title: 'Птица', note: 'Птица: картинка, отрисовка и полёт с гравитацией.' },
  { id: 'flap', title: 'Взмах', note: 'Пробел, стрелка вверх или клик — взмах.' },
  { id: 'pipes', title: 'Трубы', note: 'Трубы с дыркой и монетками. Каждые 10 секунд едут быстрее.' },
  { id: 'hit', title: 'Удар', note: 'Земля и трубы — конец игры. Труба — 1 очко, монетка — 5.' },
]

export const FINISHED_CODES: string[] = [FINISHED_ENGINE, FINISHED_BIRD, STEP_FLAP, FAST_PIPES, COIN_HIT]

export const TUTORIAL: LessonVariant = {
  id: 'tutorial',
  // v2: игры рисуют картинками, а не смайликами — старый код с fillText квесты бы не засчитали
  storageKey: 'bird-sandbox-v2',
  tabs: TUTORIAL_TABS,
  initial: TUTORIAL_CODES,
  hasGuide: true,
}

export const FINISHED: LessonVariant = {
  id: 'finished',
  // v3: v1 — с землёй и тёмными смайликами, v2 — со смайликами; готовая версия
  // своего кода ученика не хранит, поэтому её просто начинаем заново
  storageKey: 'bird-sandbox-finished-v3',
  tabs: FINISHED_TABS,
  initial: FINISHED_CODES,
  hasGuide: false,
  features: [
    'Пробел, стрелка вверх или клик по экрану — взмах.',
    'Пролетел трубу — 1 очко. Врезался в трубу или ударился о низ экрана — конец игры.',
    'Монетка в дырке — плюс 5 очков.',
    'Каждые 10 секунд трубы едут быстрее, но не быстрее maxSpeed.',
    'Гравитацию, силу взмаха, ширину дырки, цвет труб и картинки можно менять в «Движке» и «Птице».',
  ],
}
