import { DRAW_PIC } from '../engine.ts'
import type { LessonVariant, TabDef } from '../types.ts'

// Движок учебной версии — из ТЗ, с отличиями: картинку героя ученик создаёт сам во вкладке «Герой»,
// а скорости героя и яблок — 0: их ученик ставит сам в квестах после движения и после яблок. Строк bombPic
// и goldPic тоже нет: их ученик добавляет в заданиях про бомбу и звезду. Рисует всё готовая функция drawPic —
// картинки из набора HitBox вместо смайликов.
export const TUTORIAL_ENGINE = `// ===== НАСТРОЙКИ =====
var playerSpeed = 0;
var fallSpeed   = 0;
var spawnEvery  = 60;
var itemPic     = "яблоко";

// ===== СОСТОЯНИЕ ИГРЫ =====
var playerX = 170;
var playerY = 440;
var items = [];
var score = 0;
var lives = 3;
var frame = 0;
var keys = {};

// ===== КЛАВИШИ =====
document.addEventListener("keydown", function (e) { keys[e.key] = true; });
document.addEventListener("keyup",   function (e) { keys[e.key] = false; });

// ===== ЗАГОТОВКИ =====
// Пока пустые. Твои функции из других вкладок их заменят.
function movePlayer() {}
function drawPlayer() {}
function moveItems()  {}
function drawItems()  {}
function checkCatch() {}

${DRAW_PIC}

// ===== ГЛАВНЫЙ ЦИКЛ =====
function loop() {
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, 380, 470);

  if (lives > 0) {
    movePlayer();
    moveItems();
    checkCatch();
  }
  drawPlayer();
  drawItems();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 17px sans-serif";
  ctx.fillText("Счёт: " + score, 12, 26);
  ctx.fillText("Жизни: " + lives, 12, 48);

  if (lives <= 0) {
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("Игра окончена", 78, 240);
  }
  requestAnimationFrame(loop);
}
loop();`

export const BOMB_LINE = 'var bombPic     = "бомба";'
export const GOLD_LINE = 'var goldPic     = "звезда";'

// ===== Код шагов гайда — базовая версия: только яблоки, +1 очко, скорость постоянная =====
// Каждый шаг собирается кнопками по кусочкам (tasks.ts) и в итоге совпадает с этим кодом.

/** Картинка героя, с которой начинают. Квест «Выбери героя» — поменять её на свою. */
export const HERO_PIC = 'улыбка'

export const STEP_HERO = `// герой — любая картинка
var playerPic = "${HERO_PIC}";

function drawPlayer() {
  drawPic(playerPic, playerX, playerY);
}

function movePlayer() {
  if (keys["ArrowLeft"])  playerX = playerX - playerSpeed;
  if (keys["ArrowRight"]) playerX = playerX + playerSpeed;

  // не даём герою уехать за край поля
  if (playerX < 0)   playerX = 0;
  if (playerX > 340) playerX = 340;
}`

export const STEP_APPLES = `function moveItems() {
  frame = frame + 1;

  // раз в spawnEvery кадров — новое яблоко в случайном месте сверху
  if (frame % spawnEvery === 0) {
    items.push({ x: Math.random() * 340, y: 0 });
  }

  // все яблоки опускаются вниз
  for (var i = 0; i < items.length; i++) {
    items[i].y = items[i].y + fallSpeed;
  }
}

function drawItems() {
  for (var i = 0; i < items.length; i++) {
    drawPic(itemPic, items[i].x, items[i].y);
  }
}`

export const STEP_CATCH = `function checkCatch() {
  for (var i = items.length - 1; i >= 0; i--) {
    var blizko = Math.abs(items[i].x - playerX) < 34;

    if (blizko && items[i].y > playerY - 34) {
      // поймал — плюс очко
      score = score + 1;
      items.splice(i, 1);

    } else if (items[i].y > 500) {
      // уронил — минус жизнь
      lives = lives - 1;
      items.splice(i, 1);
    }
  }
}`

// ===== Задание после шага 2: функция ускорения, её собирают кнопками по частям =====

export const SPEEDUP_FN = `// каждые 15 секунд игра становится быстрее
function speedUp() {
  if (frame % 900 === 0 && fallSpeed < 8) {
    fallSpeed = fallSpeed + 1;
  }
}`

// ===== Бомба и звезда: так выглядит код, когда собраны квесты бонусов (bonus.ts) =====
// Основа — код после всех шагов: ускорение и 10 очков.

const moveItemsWith = (push: string) => `function moveItems() {
  frame = frame + 1;
  speedUp();

  // раз в spawnEvery кадров — новое яблоко в случайном месте сверху
  if (frame % spawnEvery === 0) {
    items.push(${push});
  }

  // все яблоки опускаются вниз
  for (var i = 0; i < items.length; i++) {
    items[i].y = items[i].y + fallSpeed;
  }
}`

const drawItemsWith = (pics: string) => `function drawItems() {
  for (var i = 0; i < items.length; i++) {
    var pic = itemPic;
${pics}
    drawPic(pic, items[i].x, items[i].y);
  }
}`

const makeItemWith = (kinds: string) => `// новый предмет: обычно яблоко, иногда бомба
function makeItem() {
  var kind = "apple";
${kinds}
  return { x: Math.random() * 340, y: 0, kind: kind };
}`

const BOMB_KINDS = '  if (Math.random() < 0.2) kind = "bomb";'
const BOMB_PICS = '    if (items[i].kind === "bomb") pic = bombPic;'

export const BOMB_APPLES = `${moveItemsWith('makeItem()')}

${drawItemsWith(BOMB_PICS)}

${SPEEDUP_FN}

${makeItemWith(BOMB_KINDS)}`

const catchWith = (caught: string) => `function checkCatch() {
  for (var i = items.length - 1; i >= 0; i--) {
    var blizko = Math.abs(items[i].x - playerX) < 34;

    if (blizko && items[i].y > playerY - 34) {
      if (items[i].kind === "bomb") {
        // поймал бомбу — минус жизнь
        lives = lives - 1;
${caught}      } else {
        // поймал яблоко — десять очков
        score = score + 10;
      }
      items.splice(i, 1);

    } else if (items[i].y > 500) {
      // уронил яблоко — минус жизнь, а бомбу упустить не страшно
      if (items[i].kind === "apple") lives = lives - 1;
      items.splice(i, 1);
    }
  }
}`

export const BOMB_CATCH = catchWith('')

export const GOLD_APPLES = `${moveItemsWith('makeItem()')}

${drawItemsWith(`${BOMB_PICS}\n    if (items[i].kind === "gold") pic = goldPic;`)}

${SPEEDUP_FN}

${makeItemWith(`${BOMB_KINDS}\n  else if (Math.random() < 0.1) kind = "gold";`)}`

export const GOLD_CATCH = catchWith(`      } else if (items[i].kind === "gold") {
        // поймал звезду — плюс жизнь
        lives = lives + 1;
`)

// ===== Готовая версия (?finished): бомба, звезда, +10 очков, ускорение каждые 15 секунд до 8 =====

const FINISHED_ENGINE = TUTORIAL_ENGINE.replace('var playerSpeed = 0;', 'var playerSpeed = 6;')
  .replace('var fallSpeed   = 0;', 'var fallSpeed   = 3;')
  .replace('var itemPic     = "яблоко";', `var itemPic     = "яблоко";\n${BOMB_LINE}\n${GOLD_LINE}`)

const FINISHED_HERO = STEP_HERO.replace(`"${HERO_PIC}"`, '"корзинка"')

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
    id: 'hero',
    title: 'Герой',
    step: 1,
    note: 'Шаг 1: герой — картинка, которая рисуется на холсте и ездит стрелками.',
  },
  { id: 'apples', title: 'Яблоки', step: 2, note: 'Шаг 2: яблоки появляются сверху и падают вниз.' },
  { id: 'catch', title: 'Поимка', step: 3, note: 'Шаг 3: поймал — очко, уронил — минус жизнь.' },
]

export const TUTORIAL_CODES: string[] = [
  TUTORIAL_ENGINE,
  placeholder(1, 'Здесь будет твой герой: картинка, drawPlayer и movePlayer.'),
  placeholder(2, 'Здесь будут функции moveItems и drawItems.'),
  placeholder(3, 'Здесь будет функция checkCatch.'),
]

export const FINISHED_TABS: TabDef[] = [
  {
    id: 'engine',
    title: 'Движок',
    note: 'Настройки, состояние игры и главный цикл. Картинки и скорости можно менять.',
  },
  { id: 'hero', title: 'Герой', note: 'Корзина: картинка, отрисовка и движение стрелками.' },
  { id: 'apples', title: 'Яблоки', note: 'Предметы: яблоко, бомба или звезда. Каждые 15 секунд всё падает быстрее.' },
  { id: 'catch', title: 'Поимка', note: 'Яблоко — 10 очков, бомба — минус жизнь, звезда — плюс жизнь.' },
]

export const FINISHED_CODES: string[] = [FINISHED_ENGINE, FINISHED_HERO, GOLD_APPLES, GOLD_CATCH]

export const TUTORIAL: LessonVariant = {
  id: 'tutorial',
  // v2: игры рисуют картинками, а не смайликами — старый код с fillText квесты бы не засчитали
  storageKey: 'catch-sandbox-v2',
  tabs: TUTORIAL_TABS,
  initial: TUTORIAL_CODES,
  hasGuide: true,
}

export const FINISHED: LessonVariant = {
  id: 'finished',
  storageKey: 'catch-sandbox-finished-v2',
  tabs: FINISHED_TABS,
  initial: FINISHED_CODES,
  hasGuide: false,
  features: [
    'Яблоко даёт 10 очков. Уронил — минус жизнь.',
    'Бомба: поймал — минус жизнь, упустил — ничего страшного.',
    'Звезда: поймал — плюс жизнь.',
    'Каждые 15 секунд всё падает быстрее, но не быстрее скорости 8.',
    'Скорости, частоту появления и картинки можно менять в «Движке» и «Герое».',
  ],
}
