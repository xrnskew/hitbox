// Холст рисунков HitBox: сетка 24×24 клетки, простые фигуры (круг, эллипс, многоугольник, толстая линия) и заливка,
// которая сама раскладывает фигуру по клеткам — с тенью снизу справа, светлой каймой сверху слева и контуром в одну
// клетку. Поэтому у всего набора одинаковые контур и свет. Сами рисунки — в art/, по группам. Чистый модуль: без DOM.

/** Клеток в рисунке по ширине и высоте. */
export const N = 24

/** Чернила: контур, зрачки, рот. */
export const INK = '#1b1424'

// ===== Фигуры: попадает ли точка (x, y) внутрь. Клетка закрашивается, если внутри её центр. =====

export type Shape = (x: number, y: number) => boolean
export type Pt = [number, number]

// Радиусы на 0,15 меньше: круг радиуса 10,5 иначе цеплял бы на осях по одной лишней клетке.
export const circle =
  (cx: number, cy: number, r: number): Shape =>
  (x, y) =>
    (x - cx) ** 2 + (y - cy) ** 2 <= (r - 0.15) ** 2

export const ellipse =
  (cx: number, cy: number, rx: number, ry: number): Shape =>
  (x, y) =>
    ((x - cx) / (rx - 0.15)) ** 2 + ((y - cy) / (ry - 0.15)) ** 2 <= 1

/** Прямоугольник со скруглёнными углами радиуса r. */
export const box =
  (x0: number, y0: number, x1: number, y1: number, r = 0): Shape =>
  (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false
    const dx = Math.max(x0 + r - x, 0, x - (x1 - r))
    const dy = Math.max(y0 + r - y, 0, y - (y1 - r))
    return dx * dx + dy * dy <= r * r
  }

export const poly =
  (...pts: Pt[]): Shape =>
  (x, y) => {
    let inside = false
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i]
      const [xj, yj] = pts[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
    return inside
  }

/** Толстая линия через точки толщиной w. */
export const stroke =
  (w: number, ...pts: Pt[]): Shape =>
  (x, y) =>
    pts.slice(1).some(([bx, by], i) => {
      const [ax, ay] = pts[i]
      const [dx, dy] = [bx - ax, by - ay]
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)))
      return (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2 <= (w / 2) ** 2
    })

export const or =
  (...s: Shape[]): Shape =>
  (x, y) =>
    s.some((f) => f(x, y))
export const and =
  (...s: Shape[]): Shape =>
  (x, y) =>
    s.every((f) => f(x, y))
export const not =
  (s: Shape): Shape =>
  (x, y) =>
    !s(x, y)
export const above =
  (y0: number): Shape =>
  (_x, y) =>
    y < y0

/** Фигура и её отражение справа: у симметричных рисунков пишем левую половину. */
export const pair =
  (s: Shape): Shape =>
  (x, y) =>
    s(x, y) || s(N - x, y)

/** Звезда с n лучами: внешний радиус R, внутренний r. */
export function star(cx: number, cy: number, R: number, r: number, n = 5, turn = -90): Shape {
  return poly(
    ...Array.from({ length: n * 2 }, (_, i) => {
      const a = ((turn + (i * 180) / n) * Math.PI) / 180
      const d = i % 2 ? r : R
      return [cx + d * Math.cos(a), cy + d * Math.sin(a)] as Pt
    }),
  )
}

// ===== Холст в клетках =====

/** Краска: светлая кайма, основной цвет, тень. Строка — один цвет без объёма. */
export type Paint = string | [light: string, base: string, dark: string]

export class Px {
  readonly cells: (string | null)[] = Array(N * N).fill(null)

  get(x: number, y: number) {
    return x < 0 || y < 0 || x >= N || y >= N ? null : this.cells[y * N + x]
  }

  set(x: number, y: number, c: string) {
    if (x >= 0 && y >= 0 && x < N && y < N) this.cells[y * N + x] = c
  }

  /**
   * Залить фигуру. С контуром (`line`, по умолчанию) вокруг неё встаёт рамка в одну клетку — поверх того, что
   * нарисовано раньше. Без контура заливка не трогает клетки контура: так рисуются пятна, животики, полоски.
   * Тень — где фигура (или `body`) кончается в `depth` клетках вниз-вправо, кайма — где кончается в клетке
   * вверх-влево.
   */
  fill(s: Shape, paint: Paint, { line = true, depth = 2, body = s } = {}) {
    const at = (f: Shape) => (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && f(x + 0.5, y + 0.5)
    const inside = at(s)
    // свет и тень считаются по `body`: полоски и клинья на шаре берут объём всего шара
    const solid = at(body)
    const [light, base, dark] = typeof paint === 'string' ? [paint, paint, paint] : paint
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (!inside(x, y) || (!line && this.get(x, y) === INK)) continue
        const shadow = !solid(x + 1, y + 1) || !solid(x + depth, y + depth)
        const lit = !solid(x - 1, y - 1)
        this.set(x, y, shadow && !lit ? dark : lit && !shadow ? light : base)
      }
    if (!line) return this
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++)
        if (!inside(x, y) && (inside(x + 1, y) || inside(x - 1, y) || inside(x, y + 1) || inside(x, y - 1)))
          this.set(x, y, INK)
    return this
  }

  /** Клетки по строкам от (x, y): буква — цвет из key (по умолчанию k — чернила, w — белый), «.» — не трогать. */
  stamp(x: number, y: number, rows: string[], key: Record<string, string> = {}) {
    const colors: Record<string, string> = { k: INK, w: WHITE, ...key }
    rows.forEach((row, dy) => [...row].forEach((ch, dx) => ch !== '.' && this.set(x + dx, y + dy, colors[ch])))
    return this
  }

  /** Узор слева и его зеркальная копия справа. */
  stamp2(x: number, y: number, rows: string[], key: Record<string, string> = {}) {
    const w = Math.max(...rows.map((r) => r.length))
    const mirrored = rows.map((r) => [...r.padEnd(w, '.')].reverse().join(''))
    return this.stamp(x, y, rows, key).stamp(N - x - w, y, mirrored, key)
  }

  /** Отдельные клетки одного цвета. */
  dots(c: string, ...pts: Pt[]) {
    for (const [x, y] of pts) this.set(x, y, c)
    return this
  }

  /** То же самое и зеркально справа. */
  dots2(c: string, ...pts: Pt[]) {
    return this.dots(c, ...pts, ...pts.map(([x, y]) => [N - 1 - x, y] as Pt))
  }
}

// ===== Краски =====

export const WHITE = '#ffffff'
export const CREAM = '#fff4e2'
export const BLUSH = '#ff8fb0'

export const YELLOW: Paint = ['#fff09a', '#ffcd38', '#e08a17']
export const ORANGE: Paint = ['#ffb066', '#f6832a', '#bf5119']
export const FOX: Paint = ['#ffa95a', '#ee6c1f', '#ae4413']
export const GREEN: Paint = ['#a8ee78', '#4bbd49', '#24813a']
export const LEAF: Paint = ['#8fe07a', '#3fae47', '#22773a']
export const METAL: Paint = ['#ffffff', '#c9cedd', '#7f86a0']
export const NAVY: Paint = ['#5b6bd8', '#2d377c', '#171c48']
export const WOOD: Paint = ['#eab06e', '#c98a4b', '#8a4f22']
export const RED: Paint = ['#ff7d6f', '#e5323b', '#9c1730']
export const PEAR: Paint = ['#e9fb9c', '#a8d943', '#5f9a26']
export const CHERRY: Paint = ['#ff7f8f', '#d72646', '#8c112c']
export const DOUGH: Paint = ['#ffe1aa', '#e8ad67', '#b5763a']
export const ICING: Paint = ['#ffc6de', '#ff7db1', '#d64a86']
export const SKY: Paint = ['#aaeeff', '#3db6ea', '#1c6dbf']
export const COAL: Paint = ['#8f95ad', '#424760', '#1f2130']
export const GOLD: Paint = ['#fff09c', '#ffc632', '#d4851a']
export const ROSE: Paint = ['#ff93a8', '#ee3a5a', '#a31535']
export const BLUE: Paint = ['#93bbff', '#3a66e0', '#1f3a9a']
export const BLUE_WING: Paint = ['#c4dbff', '#7097f2', '#3a5fc9']
export const OWL: Paint = ['#dca26b', '#a0602f', '#653a1b']
export const PURPLE: Paint = ['#c9a4ff', '#8456d8', '#4f2c95']
export const VIOLET: Paint = ['#d9baff', '#9358e6', '#5a2fa3']
export const PINK: Paint = ['#ffc4dc', '#ff6fa8', '#c73a76']
export const ROCK: Paint = ['#cdc3b4', '#8c7f70', '#544a40']
export const CRATER: Paint = ['#544a40', '#74685b', '#b6ab9b']
export const GLASS: Paint = ['#ecfbff', '#8fe0f5', '#3fa9d6']
export const FIRE: Paint = ['#ffd26a', '#ff9a2e', '#e0601a']
export const GREY: Paint = ['#b8bed0', '#8a91aa', '#5c6380']
export const TAN: Paint = ['#f7d3a1', '#e0a464', '#a8672e']
export const BROWN: Paint = ['#c98a5a', '#9a5f34', '#5e361a']
export const SNOW: Paint = ['#ffffff', '#f1f1f6', '#b9bccc']
export const SOOT: Paint = ['#5a5a6c', '#2e2e3c', '#17171f']
export const BANANA: Paint = ['#fff59a', '#ffd93b', '#d9a21a']
export const MELON: Paint = ['#ff9a9a', '#ff4b5c', '#c2263b']
export const CARROT: Paint = ['#ffb35c', '#ff8a1f', '#c95a12']
export const CHEESE: Paint = ['#fff2a0', '#ffd04a', '#e0a024']
export const CANDY: Paint = ['#ffd1e6', '#ff6fb0', '#c43a7a']
export const GEM: Paint = ['#e2fcff', '#5ce1f5', '#1f9ac9']
export const WING: Paint = ['#ffd27a', '#ffa630', '#d0661a']
export const GHOST: Paint = ['#ffffff', '#eef0ff', '#a9b0d6']
export const SATURN: Paint = ['#ffd6a0', '#f4a24a', '#b8662a']
export const RING: Paint = ['#fff3c4', '#e8d07a', '#b09a4a']
export const SOLAR: Paint = ['#8fbaff', '#3a66e0', '#1f3a9a']

/** Глаз-бусинка 2×3 с бликом. */
export const BEAD = ['wk', 'kk', 'kk']
/** Большой глаз-фасолина 4×5, блик со всех сторон в тёмном. */
export const EYE = ['.kk.', 'kwkk', 'kkkk', 'kkkk', '.kk.']
/** Зрачок 2×2 с бликом. */
export const PUPIL = ['wk', 'kk']

/** Рисунок: что нарисовать на чистом холсте. */
export type Art = (p: Px) => unknown
