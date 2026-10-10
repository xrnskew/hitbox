import type { Hint, HintSet } from './types.ts'

// Подсказки, общие для всех игр: холст и кисточка, главный цикл, Math, console и массивы.
// Своё у каждой игры — только имена её движка и шагов.

const COMMON_GLOBALS: Hint[] = [
  { name: 'ctx', kind: 'variable', text: 'Кисточка для рисования на холсте: ctx.fillText, ctx.fillRect…' },
  { name: 'canvas', kind: 'variable', text: 'Сам холст игры, 380 × 470 пикселей.' },
  { name: 'loop', kind: 'function', detail: '()', text: 'Главный цикл движка. Перерисовывает поле 60 раз в секунду.' },
  {
    name: 'drawPic',
    kind: 'function',
    detail: '(name, x, y)',
    text: 'Движок: рисует картинку 34 × 34 по имени, например drawPic("кот", x, y). Низ картинки — на высоте y.',
  },
  {
    name: 'picture',
    kind: 'function',
    detail: '(name, size)',
    text: 'Картинка из набора HitBox по имени: "ракета", "кот", "яблоко"… size — размер, по умолчанию 34. Неизвестное имя — знак вопроса.',
  },
  {
    name: 'requestAnimationFrame',
    kind: 'function',
    detail: '(f)',
    text: 'Попросить браузер вызвать f в следующем кадре.',
  },
]

const CTX: Hint[] = [
  { name: 'fillText', kind: 'method', detail: '(text, x, y)', text: 'Написать текст или эмодзи в точке x, y.' },
  { name: 'fillRect', kind: 'method', detail: '(x, y, w, h)', text: 'Закрасить прямоугольник шириной w и высотой h.' },
  { name: 'strokeRect', kind: 'method', detail: '(x, y, w, h)', text: 'Нарисовать рамку прямоугольника.' },
  { name: 'fillStyle', kind: 'property', text: 'Цвет заливки, например "#ffd54a" или "red".' },
  { name: 'strokeStyle', kind: 'property', text: 'Цвет линий и рамок.' },
  { name: 'font', kind: 'property', text: 'Шрифт для fillText, например "34px serif".' },
  { name: 'beginPath', kind: 'method', detail: '()', text: 'Начать новую фигуру.' },
  { name: 'arc', kind: 'method', detail: '(x, y, r, 0, 2 * Math.PI)', text: 'Круг с центром x, y и радиусом r.' },
  { name: 'fill', kind: 'method', detail: '()', text: 'Залить фигуру цветом fillStyle.' },
  {
    name: 'globalAlpha',
    kind: 'property',
    text: 'Прозрачность всего, что рисуется дальше: 1 — как есть, 0.5 — наполовину.',
  },
  { name: 'save', kind: 'method', detail: '()', text: 'Запомнить кисточку: цвет, шрифт, прозрачность.' },
  { name: 'restore', kind: 'method', detail: '()', text: 'Вернуть кисточку, какой она была при save().' },
]

const MATH: Hint[] = [
  { name: 'random', kind: 'method', detail: '()', text: 'Случайное число от 0 до 1 (1 не бывает).' },
  { name: 'abs', kind: 'method', detail: '(x)', text: 'Число без минуса: Math.abs(-5) — это 5.' },
  { name: 'floor', kind: 'method', detail: '(x)', text: 'Округлить вниз: Math.floor(4.7) — это 4.' },
  { name: 'round', kind: 'method', detail: '(x)', text: 'Округлить до ближайшего целого.' },
  { name: 'min', kind: 'method', detail: '(a, b)', text: 'Меньшее из чисел.' },
  { name: 'max', kind: 'method', detail: '(a, b)', text: 'Большее из чисел.' },
  { name: 'PI', kind: 'constant', text: 'Число пи, 3.14159…' },
]

const CONSOLE: Hint[] = [
  { name: 'log', kind: 'method', detail: '(...)', text: 'Вывести значение в «Консоль» под игрой.' },
  { name: 'warn', kind: 'method', detail: '(...)', text: 'Вывести предупреждение — оно будет жёлтым.' },
]

const ARRAY: Hint[] = [
  { name: 'length', kind: 'property', text: 'Сколько элементов в массиве.' },
  { name: 'push', kind: 'method', detail: '(x)', text: 'Добавить элемент в конец массива.' },
  { name: 'shift', kind: 'method', detail: '()', text: 'Убрать первый элемент массива.' },
  {
    name: 'splice',
    kind: 'method',
    detail: '(i, 1)',
    text: 'Убрать элемент номер i. Все, кто после него, сдвинутся на одно место влево.',
  },
]

/** Подсказки игры: её имена + общие. `arrays` — массивы движка, после их точки подсказываются push, splice… */
export function hintSet(o: { globals: Hint[]; arrays: string[]; watch: string[] }): HintSet {
  return {
    globals: [...o.globals, ...COMMON_GLOBALS],
    members: { ctx: CTX, Math: MATH, console: CONSOLE, ...Object.fromEntries(o.arrays.map((a) => [a, ARRAY])) },
    watch: o.watch,
  }
}
