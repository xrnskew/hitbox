import { DRAW_PIC } from '../engine.ts'
import type { LessonVariant, TabDef } from '../types.ts'

// Космос. Новое по сравнению с Корзинкой и Птичкой: два массива сразу (пули и пришельцы), вложенный цикл
// «каждый пришелец × каждая пуля» и перезарядка — счётчик, который каждый кадр уменьшается до нуля.
// Скоростей, перезарядки, цвета пуль и картинки пришельца в движке нет: они во вкладках своих шагов, там ученик
// их и ставит в квестах. Строк boomPic и maxSpeed нет: их ученик добавляет в дополнительных заданиях.
//
// Все массивы — только в «Движке», даже booms из задания «Взрывы»: так их видно в одном месте. Первый кадр —
// requestAnimationFrame в конце движка, когда выполнились все вкладки и их var уже на месте.

/** Цвет пуль, с которого начинают. Квест «Цвет пуль» — выбрать свой. */
export const BULLET_COLOR = '#ffd54a'
/** Картинка пришельца в «Движке». Квест «Свой пришелец» — поменять её. */
export const ENEMY_PIC = 'пришелец'

export const TUTORIAL_ENGINE = `// ===== НАСТРОЙКИ =====
var waveSize    = 5;

// ===== СОСТОЯНИЕ ИГРЫ =====
var shipX = 170;
var shipY = 450;
var bullets = [];
var enemies = [];
var booms = [];
var reload = 0;
var score = 0;
var lives = 3;
var wave = 0;
var frame = 0;
var keys = {};

// ===== КЛАВИШИ =====
// ← → — лететь, пробел — стрелять (можно держать)
document.addEventListener("keydown", function (e) { keys[e.key] = true; });
document.addEventListener("keyup",   function (e) { keys[e.key] = false; });

// ===== ЗАГОТОВКИ =====
// Пока пустые. Твои функции из других вкладок их заменят.
function drawShip()    {}
function moveShip()    {}
function shoot()       {}
function moveBullets() {}
function drawBullets() {}
function moveEnemies() {}
function drawEnemies() {}
function checkHits()   {}

${DRAW_PIC}

// ===== КОСМОС =====
// Готовый фон: звёзды и луна. Звёзды медленно летят вниз — кажется, что корабль летит вперёд.
var stars = [];
for (var n = 0; n < 40; n++) {
  stars.push({ x: Math.random() * 380, y: Math.random() * 470 });
}

function drawSpace() {
  ctx.fillStyle = "#8b93b8";
  for (var n = 0; n < stars.length; n++) {
    stars[n].y = stars[n].y + 0.5;
    if (stars[n].y > 470) stars[n].y = 0;
    ctx.fillRect(stars[n].x, stars[n].y, 2, 2);
  }

  // большая луна из набора картинок; save и restore: полупрозрачная только она, картинки после неё — яркие
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.drawImage(picture("луна", 102), 252, 64, 102, 102);
  ctx.restore();
}

// ===== НОВАЯ ВОЛНА =====
// Прилетела новая волна — полторы секунды крупно пишем её номер, в конце надпись гаснет.
var shownWave = 0;
var banner = 0;

function drawBanner() {
  if (wave !== shownWave) {
    shownWave = wave;
    banner = 90;
  }
  if (banner <= 0 || lives <= 0) return;
  banner = banner - 1;
  ctx.save();
  ctx.globalAlpha = Math.min(1, banner / 30);
  ctx.fillStyle = "#ffd54a";
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Волна " + wave, 190, 230);
  ctx.restore();
}

// ===== ГЛАВНЫЙ ЦИКЛ =====
function loop() {
  ctx.fillStyle = "#0b0d1a";
  ctx.fillRect(0, 0, 380, 470);
  drawSpace();

  if (lives > 0) {
    frame = frame + 1;
    moveShip();
    shoot();
    moveBullets();
    moveEnemies();
    checkHits();
  }
  drawBullets();
  drawEnemies();
  drawShip();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 17px sans-serif";
  ctx.fillText("Счёт: " + score, 12, 26);
  ctx.fillText("Жизни: " + Math.max(0, lives), 12, 48);
  ctx.fillText("Волна: " + wave, 12, 70);
  drawBanner();

  if (lives <= 0) {
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("Игра окончена", 78, 240);
  }
  requestAnimationFrame(loop);
}
// первый кадр — когда выполнятся все вкладки: их переменные уже будут на месте
requestAnimationFrame(loop);`

/** Настройки шагов — во вкладках шагов, над функциями, которые их используют. Квесты меняют их значения. */
export const SHIP_SPEED_LINE = (n: number | string = 0) => `// скорость корабля: сколько пикселей он пролетает за кадр
var shipSpeed = ${n};`
export const RELOAD_LINE = (n: number | string = 0) => `// перезарядка: сколько кадров ждать между выстрелами
var reloadTime = ${n};`
export const BULLET_SPEED_LINE = (n: number | string = 0) => `// скорость пуль: сколько пикселей они пролетают за кадр
var bulletSpeed = ${n};`
export const BULLET_COLOR_LINE = (c = `"${BULLET_COLOR}"`) => `// цвет пуль
var bulletColor = ${c};`
export const ENEMY_SPEED_LINE = (
  n: number | string = 0,
) => `// скорость пришельцев: на сколько пикселей они спускаются за кадр
var enemySpeed = ${n};`
export const ENEMY_PIC_LINE = (pic = `"${ENEMY_PIC}"`) => `// пришелец — любая картинка
var enemyPic = ${pic};`

export const BOOM_LINE = 'var boomPic     = "взрыв";'
export const MAX_SPEED_LINE = 'var maxSpeed    = 2;'

// ===== Код шагов гайда — базовая версия: без взрывов, скорость пришельцев постоянная =====
// Каждый шаг собирается кнопками по кусочкам (tasks.ts) и в итоге совпадает с этим кодом.

/** Смайлик корабля, с которого начинают. Квест «Выбери корабль» — поменять его на свой. */
export const SHIP_PIC = 'ракета'

export const STEP_SHIP = `// корабль — любая картинка
var shipPic = "${SHIP_PIC}";

function drawShip() {
  drawPic(shipPic, shipX, shipY);
}

${SHIP_SPEED_LINE()}

function moveShip() {
  if (keys["ArrowLeft"])  shipX = shipX - shipSpeed;
  if (keys["ArrowRight"]) shipX = shipX + shipSpeed;

  // не даём кораблю улететь за край
  if (shipX < 0)   shipX = 0;
  if (shipX > 340) shipX = 340;
}`

export const STEP_BULLETS = `${RELOAD_LINE()}

function shoot() {
  // перезарядка: пока счётчик не дошёл до нуля — не стреляем
  if (reload > 0) {
    reload = reload - 1;
    return;
  }

  // пробел — новая пуля из носа корабля
  if (keys[" "]) {
    bullets.push({ x: shipX + 15, y: shipY - 34 });
    reload = reloadTime;
  }
}

${BULLET_SPEED_LINE()}

function moveBullets() {
  // все пули летят вверх
  for (var i = 0; i < bullets.length; i++) {
    bullets[i].y = bullets[i].y - bulletSpeed;
  }

  // пуля улетела за верхний край — убираем её
  if (bullets.length > 0 && bullets[0].y < -20) {
    bullets.shift();
  }
}

${BULLET_COLOR_LINE()}

function drawBullets() {
  ctx.fillStyle = bulletColor;
  for (var i = 0; i < bullets.length; i++) {
    ctx.fillRect(bullets[i].x, bullets[i].y, 4, 14);
  }
}`

const ENEMIES = (fast = '', boom = '') => `${ENEMY_SPEED_LINE()}

function moveEnemies() {
  // пришельцев не осталось — летит новая волна
  if (enemies.length === 0) {
    wave = wave + 1;${fast}
    for (var k = 0; k < waveSize; k++) {
      // в случайном месте, каждый следующий выше — прилетают по одному;
      // dx — своя скорость вбок у каждого
      enemies.push({ x: Math.random() * 340, y: 40 - k * 60, dx: 0.5 + Math.random() * 1.5 });
    }
  }

  for (var i = 0; i < enemies.length; i++) {
    var a = enemies[i];
    // все спускаются вниз
    a.y = a.y + enemySpeed;
    // и летят вбок зигзагом: у края — разворот
    a.x = a.x + a.dx;
    if (a.x < 0 || a.x > 340) a.dx = -a.dx;
  }
}

${ENEMY_PIC_LINE()}

function drawEnemies() {
  for (var i = 0; i < enemies.length; i++) {
    drawPic(enemyPic, enemies[i].x, enemies[i].y);
  }${boom}
}`

export const STEP_ENEMIES = ENEMIES()

const HITS = (boom = '') => `function checkHits() {
  // каждый пришелец × каждая пуля
  for (var i = enemies.length - 1; i >= 0; i--) {
    var a = enemies[i];

    for (var j = bullets.length - 1; j >= 0; j--) {
      var b = bullets[j];
      // пуля внутри рамки пришельца?
      var popal = b.x + 4 > a.x && b.x < a.x + 34 && b.y < a.y && b.y + 14 > a.y - 30;

      if (popal) {
        // сбил — убираем и пришельца, и пулю
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        // плюс очко
        score = score + 1;${boom}
        // этого пришельца больше нет — другие пули его уже не проверяют
        break;
      }
    }
  }

  // пришелец долетел до корабля — минус жизнь
  for (var i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].y > shipY - 10) {
      lives = lives - 1;
      enemies.splice(i, 1);
    }
  }
}`

export const STEP_HITS = HITS()

// ===== Взрывы и «Волна за волной»: основа — код после всех шагов =====

const BOOM_DRAW = `

  // взрывы горят 20 кадров и гаснут
  for (var i = booms.length - 1; i >= 0; i--) {
    drawPic(boomPic, booms[i].x, booms[i].y);
    booms[i].t = booms[i].t - 1;
    if (booms[i].t <= 0) booms.splice(i, 1);
  }`

const BOOM_PUSH = `
        // на месте пришельца — взрыв
        booms.push({ x: a.x, y: a.y, t: 20 });`

const FAST = `

    // каждая новая волна больше и быстрее, но не быстрее maxSpeed
    if (wave > 1 && enemySpeed < maxSpeed) {
      enemySpeed = enemySpeed + 0.25;
      waveSize = waveSize + 1;
    }
`

export const BOOM_ENEMIES = ENEMIES('', BOOM_DRAW)
export const BOOM_HITS = HITS(BOOM_PUSH)
export const FAST_ENEMIES = ENEMIES(FAST, BOOM_DRAW)

// ===== Готовая версия (?finished): взрывы, волны всё больше и быстрее, всё настроено =====

const FINISHED_ENGINE = TUTORIAL_ENGINE.replace(
  'var waveSize    = 5;',
  `var waveSize    = 5;\n${BOOM_LINE}\n${MAX_SPEED_LINE}`,
)

// ===== Вкладки =====

const placeholder = (step: number, what: string) =>
  `// Шаг ${step}. ${what}\n// Не знаешь, с чего начать? Открой вкладку «Гайд».`

export const TUTORIAL_TABS: TabDef[] = [
  {
    id: 'engine',
    title: 'Движок',
    note: 'Готовый движок: настройки, состояние игры, космос и главный цикл. Размер волны сверху можно менять.',
  },
  { id: 'ship', title: 'Корабль', step: 1, note: 'Шаг 1: корабль — картинка внизу, летает стрелками ← →.' },
  {
    id: 'bullets',
    title: 'Пули',
    step: 2,
    note: 'Шаг 2: пробел — выстрел. Пули — второй массив, между выстрелами перезарядка.',
  },
  { id: 'enemies', title: 'Пришельцы', step: 3, note: 'Шаг 3: пришельцы летят волнами — вниз и зигзагом.' },
  {
    id: 'hits',
    title: 'Попадание',
    step: 4,
    note: 'Шаг 4: каждая пуля × каждый пришелец — сбил или нет. Долетел до корабля — минус жизнь.',
  },
]

export const TUTORIAL_CODES: string[] = [
  TUTORIAL_ENGINE,
  placeholder(1, 'Здесь будет твой корабль: картинка, drawShip и moveShip.'),
  placeholder(2, 'Здесь будут функции shoot, moveBullets и drawBullets.'),
  placeholder(3, 'Здесь будут функции moveEnemies и drawEnemies.'),
  placeholder(4, 'Здесь будет функция checkHits.'),
]

export const FINISHED_TABS: TabDef[] = [
  {
    id: 'engine',
    title: 'Движок',
    note: 'Настройки, состояние игры, космос и главный цикл. Размер волны можно менять.',
  },
  { id: 'ship', title: 'Корабль', note: 'Корабль: картинка, отрисовка и полёт стрелками.' },
  { id: 'bullets', title: 'Пули', note: 'Пробел — выстрел, между выстрелами перезарядка reloadTime кадров.' },
  {
    id: 'enemies',
    title: 'Пришельцы',
    note: 'Волны пришельцев летят зигзагом — каждая больше и быстрее прошлой. Взрывы горят 20 кадров.',
  },
  {
    id: 'hits',
    title: 'Попадание',
    note: 'Каждая пуля × каждый пришелец: сбил — очко и взрыв. Долетел — минус жизнь.',
  },
]

export const FINISHED_CODES: string[] = [
  FINISHED_ENGINE,
  STEP_SHIP.replace(SHIP_SPEED_LINE(), SHIP_SPEED_LINE(6)),
  STEP_BULLETS.replace(RELOAD_LINE(), RELOAD_LINE(12)).replace(BULLET_SPEED_LINE(), BULLET_SPEED_LINE(9)),
  FAST_ENEMIES.replace(ENEMY_SPEED_LINE(), ENEMY_SPEED_LINE(1)),
  BOOM_HITS,
]

export const TUTORIAL: LessonVariant = {
  id: 'tutorial',
  // настройки шагов раньше были в «Движке» — в старых сохранениях переезжают во вкладки шагов
  moved: [
    { name: 'shipSpeed', tab: 1, was: '0', line: (v) => SHIP_SPEED_LINE(v) },
    { name: 'reloadTime', tab: 2, was: '0', line: (v) => RELOAD_LINE(v) },
    { name: 'bulletSpeed', tab: 2, was: '0', line: (v) => BULLET_SPEED_LINE(v) },
    { name: 'bulletColor', tab: 2, was: `"${BULLET_COLOR}"`, line: (v) => BULLET_COLOR_LINE(v) },
    { name: 'enemySpeed', tab: 3, was: '0', line: (v) => ENEMY_SPEED_LINE(v) },
    { name: 'enemyPic', tab: 3, was: `"${ENEMY_PIC}"`, line: (v) => ENEMY_PIC_LINE(v) },
  ],
  // v2: игры рисуют картинками, а не смайликами — старый код с fillText квесты бы не засчитали
  storageKey: 'space-sandbox-v2',
  tabs: TUTORIAL_TABS,
  initial: TUTORIAL_CODES,
  hasGuide: true,
}

export const FINISHED: LessonVariant = {
  id: 'finished',
  storageKey: 'space-sandbox-finished-v2',
  tabs: FINISHED_TABS,
  initial: FINISHED_CODES,
  hasGuide: false,
  features: [
    'Стрелки ← → — лететь, пробел — стрелять. Пробел можно держать: корабль стреляет сам, с перезарядкой.',
    'Сбил пришельца — 1 очко и взрыв. Пришелец долетел до корабля — минус жизнь, жизней три.',
    'Пришельцы летят волнами, вниз и зигзагом. Каждая новая волна больше и быстрее прошлой, но не быстрее maxSpeed.',
    'Скорость корабля — в «Корабле», перезарядка, скорость и цвет пуль — в «Пулях», скорость и картинка пришельцев — в «Пришельцах», размер волны — в «Движке».',
  ],
}
