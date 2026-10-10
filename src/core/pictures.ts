// Рисунки игр HitBox — пиксель-арт 24×24 клетки. Холст и заливка — в pixels.ts, сами рисунки — в art/, по группам.
// В игре рисунок занимает 34×34, как прежний смайлик, — рамки столкновений те же.
// Имя рисунка — по-русски, его пишет ученик: drawPic("ракета", x, y). Чистый модуль: без DOM.
import { ANIMALS } from './art/animals.ts'
import { FAIRY } from './art/fairy.ts'
import { FOOD } from './art/food.ts'
import { NATURE } from './art/nature.ts'
import { SMILES } from './art/smiles.ts'
import { SPACE } from './art/space.ts'
import { THINGS } from './art/things.ts'
import { TRANSPORT } from './art/transport.ts'
import { TREASURE } from './art/treasure.ts'
import { type Art, box, GREY, N, Px } from './pixels.ts'

export { INK, N as PICTURE_SIZE } from './pixels.ts'

const SETS: { title: string; art: Record<string, Art> }[] = [
  { title: 'Смайлы', art: SMILES },
  { title: 'Животные', art: ANIMALS },
  { title: 'Сказка', art: FAIRY },
  { title: 'Еда', art: FOOD },
  { title: 'Сокровища', art: TREASURE },
  { title: 'Вещи', art: THINGS },
  { title: 'Природа', art: NATURE },
  { title: 'Транспорт', art: TRANSPORT },
  { title: 'Космос', art: SPACE },
]

/** Группы в окне выбора — в таком порядке. */
export const PICTURE_GROUPS: { title: string; names: string[] }[] = SETS.map((s) => ({
  title: s.title,
  names: Object.keys(s.art),
}))

/** Все имена рисунков, которые можно выбрать. */
export const PICTURE_NAMES = PICTURE_GROUPS.flatMap((g) => g.names)

/** Его игра рисует вместо картинки с неизвестным именем — например, с опечаткой. */
export const UNKNOWN_PICTURE = '?'

/**
 * Прежние имена: они остались в сохранённом коде учеников и должны рисоваться как раньше.
 * В окне выбора их нет.
 */
export const PICTURE_ALIASES: Record<string, string> = {
  колобок: 'улыбка',
  мышь: 'летучая мышь',
}

/** Знак вопроса — вместо неизвестного имени. */
const UNKNOWN_ART: Art = (p: Px) =>
  p
    .fill(box(2, 2, 22, 22, 4), GREY)
    .stamp(8, 6, [
      '..wwww..',
      '.wwwwww.',
      'ww....ww',
      '......ww',
      '.....ww.',
      '....ww..',
      '...ww...',
      '...ww...',
      '........',
      '...ww...',
      '...ww...',
    ])

const ART: Record<string, Art> = Object.assign({}, ...SETS.map((s) => s.art), { [UNKNOWN_PICTURE]: UNKNOWN_ART })

/** Имя из кода → имя рисунка в наборе: прежнее имя — его замена, неизвестное — «?». */
const resolve = (name: string) => {
  const key = Object.hasOwn(PICTURE_ALIASES, name) ? PICTURE_ALIASES[name] : name
  return Object.hasOwn(ART, key) ? key : UNKNOWN_PICTURE
}

// ===== Готовые рисунки =====

const grids = new Map<string, (string | null)[]>()

/** Клетки рисунка: N строк по N цветов, null — пусто. Неизвестное имя — рисунок «?». */
export function pictureGrid(name: string): (string | null)[][] {
  const key = resolve(name)
  let cells = grids.get(key)
  if (!cells) {
    const p = new Px()
    ART[key](p)
    cells = p.cells
    grids.set(key, cells)
  }
  return Array.from({ length: N }, (_, y) => cells.slice(y * N, y * N + N))
}

export const isPicture = (name: string) => resolve(name) !== UNKNOWN_PICTURE

/** SVG-разметка рисунка: путь на каждый цвет, клетки одного цвета подряд в строке — одним прямоугольником. */
export function pictureSvg(name: string): string {
  const runs = new Map<string, string>()
  pictureGrid(name).forEach((row, y) => {
    for (let x = 0; x < N; ) {
      const c = row[x]
      let w = 1
      while (x + w < N && row[x + w] === c) w++
      if (c) runs.set(c, `${runs.get(c) ?? ''}M${x} ${y}h${w}v1h-${w}z`)
      x += w
    }
  })
  const paths = [...runs].map(([c, d]) => `<path fill="${c}" d="${d}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges">${paths}</svg>`
}

/** Рисунок как адрес картинки — для <img>, CSS и new Image(). */
export const pictureUrl = (name: string): string => `data:image/svg+xml,${encodeURIComponent(pictureSvg(name))}`
