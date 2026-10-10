// Рисунки игр HitBox — пиксель-арт 24×24 клетки. Рисунок собирается из простых фигур (круг, эллипс, многоугольник,
// толстая линия), а программа сама раскладывает их по клеткам: заливка с тенью снизу справа и светлой каймой сверху
// слева, контур в одну клетку вокруг каждой фигуры, поверх — мелочи по клеткам (глаза, блики, рот). Поэтому у всего
// набора одинаковые контур и свет. В игре рисунок занимает 34×34, как прежний смайлик, — рамки столкновений те же.
// Имя рисунка — по-русски, его пишет ученик: drawPic("ракета", x, y). Чистый модуль: без DOM.

/** Группы в окне выбора — в таком порядке. */
export const PICTURE_GROUPS: { title: string; names: string[] }[] = [
  {
    title: 'Герои',
    names: ['колобок', 'кот', 'собака', 'лиса', 'заяц', 'мишка', 'панда', 'лягушка', 'робот', 'пингвин', 'корзинка'],
  },
  {
    title: 'Еда',
    names: ['яблоко', 'груша', 'вишня', 'клубника', 'банан', 'арбуз', 'морковка', 'пончик', 'пицца', 'конфета', 'рыба'],
  },
  {
    title: 'Вещи',
    names: ['бомба', 'звезда', 'монетка', 'сердце', 'молния', 'алмаз', 'ключ', 'гриб', 'подарок', 'мяч', 'труба'],
  },
  {
    title: 'Летают',
    names: ['цыплёнок', 'птичка', 'сова', 'пчела', 'бабочка', 'божья коровка', 'мышь', 'дракон', 'призрак', 'шарик'],
  },
  {
    title: 'Космос',
    names: ['ракета', 'тарелка', 'пришелец', 'осьминог', 'астероид', 'комета', 'планета', 'спутник', 'взрыв', 'луна'],
  },
]

/** Все имена рисунков, которые можно выбрать. */
export const PICTURE_NAMES = PICTURE_GROUPS.flatMap((g) => g.names)

/** Его игра рисует вместо картинки с неизвестным именем — например, с опечаткой. */
export const UNKNOWN_PICTURE = '?'

/** Клеток в рисунке по ширине и высоте. */
export const PICTURE_SIZE = 24
const N = PICTURE_SIZE

/** Чернила: контур, зрачки, рот. */
export const INK = '#1b1424'

// ===== Фигуры: попадает ли точка (x, y) внутрь. Клетка закрашивается, если внутри её центр. =====

type Shape = (x: number, y: number) => boolean
type Pt = [number, number]

// Радиусы на 0,15 меньше: круг радиуса 10,5 иначе цеплял бы на осях по одной лишней клетке.
const circle =
  (cx: number, cy: number, r: number): Shape =>
  (x, y) =>
    (x - cx) ** 2 + (y - cy) ** 2 <= (r - 0.15) ** 2

const ellipse =
  (cx: number, cy: number, rx: number, ry: number): Shape =>
  (x, y) =>
    ((x - cx) / (rx - 0.15)) ** 2 + ((y - cy) / (ry - 0.15)) ** 2 <= 1

/** Прямоугольник со скруглёнными углами радиуса r. */
const box =
  (x0: number, y0: number, x1: number, y1: number, r = 0): Shape =>
  (x, y) => {
    if (x < x0 || x > x1 || y < y0 || y > y1) return false
    const dx = Math.max(x0 + r - x, 0, x - (x1 - r))
    const dy = Math.max(y0 + r - y, 0, y - (y1 - r))
    return dx * dx + dy * dy <= r * r
  }

const poly =
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
const stroke =
  (w: number, ...pts: Pt[]): Shape =>
  (x, y) =>
    pts.slice(1).some(([bx, by], i) => {
      const [ax, ay] = pts[i]
      const [dx, dy] = [bx - ax, by - ay]
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)))
      return (x - ax - t * dx) ** 2 + (y - ay - t * dy) ** 2 <= (w / 2) ** 2
    })

const or =
  (...s: Shape[]): Shape =>
  (x, y) =>
    s.some((f) => f(x, y))
const and =
  (...s: Shape[]): Shape =>
  (x, y) =>
    s.every((f) => f(x, y))
const not =
  (s: Shape): Shape =>
  (x, y) =>
    !s(x, y)
const above =
  (y0: number): Shape =>
  (_x, y) =>
    y < y0

/** Фигура и её отражение справа: у симметричных рисунков пишем левую половину. */
const pair =
  (s: Shape): Shape =>
  (x, y) =>
    s(x, y) || s(N - x, y)

/** Звезда с n лучами: внешний радиус R, внутренний r. */
function star(cx: number, cy: number, R: number, r: number, n = 5, turn = -90): Shape {
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
type Paint = string | [light: string, base: string, dark: string]

class Px {
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

const WHITE = '#ffffff'
const CREAM = '#fff4e2'
const BLUSH = '#ff8fb0'

const YELLOW: Paint = ['#fff09a', '#ffcd38', '#e08a17']
const ORANGE: Paint = ['#ffb066', '#f6832a', '#bf5119']
const FOX: Paint = ['#ffa95a', '#ee6c1f', '#ae4413']
const GREEN: Paint = ['#a8ee78', '#4bbd49', '#24813a']
const LEAF: Paint = ['#8fe07a', '#3fae47', '#22773a']
const METAL: Paint = ['#ffffff', '#c9cedd', '#7f86a0']
const NAVY: Paint = ['#5b6bd8', '#2d377c', '#171c48']
const WOOD: Paint = ['#eab06e', '#c98a4b', '#8a4f22']
const RED: Paint = ['#ff7d6f', '#e5323b', '#9c1730']
const PEAR: Paint = ['#e9fb9c', '#a8d943', '#5f9a26']
const CHERRY: Paint = ['#ff7f8f', '#d72646', '#8c112c']
const DOUGH: Paint = ['#ffe1aa', '#e8ad67', '#b5763a']
const ICING: Paint = ['#ffc6de', '#ff7db1', '#d64a86']
const SKY: Paint = ['#aaeeff', '#3db6ea', '#1c6dbf']
const COAL: Paint = ['#8f95ad', '#424760', '#1f2130']
const GOLD: Paint = ['#fff09c', '#ffc632', '#d4851a']
const ROSE: Paint = ['#ff93a8', '#ee3a5a', '#a31535']
const BLUE: Paint = ['#93bbff', '#3a66e0', '#1f3a9a']
const BLUE_WING: Paint = ['#c4dbff', '#7097f2', '#3a5fc9']
const OWL: Paint = ['#dca26b', '#a0602f', '#653a1b']
const PURPLE: Paint = ['#c9a4ff', '#8456d8', '#4f2c95']
const VIOLET: Paint = ['#d9baff', '#9358e6', '#5a2fa3']
const PINK: Paint = ['#ffc4dc', '#ff6fa8', '#c73a76']
const ROCK: Paint = ['#cdc3b4', '#8c7f70', '#544a40']
const CRATER: Paint = ['#544a40', '#74685b', '#b6ab9b']
const GLASS: Paint = ['#ecfbff', '#8fe0f5', '#3fa9d6']
const FIRE: Paint = ['#ffd26a', '#ff9a2e', '#e0601a']
const GREY: Paint = ['#b8bed0', '#8a91aa', '#5c6380']
const TAN: Paint = ['#f7d3a1', '#e0a464', '#a8672e']
const BROWN: Paint = ['#c98a5a', '#9a5f34', '#5e361a']
const SNOW: Paint = ['#ffffff', '#f1f1f6', '#b9bccc']
const SOOT: Paint = ['#5a5a6c', '#2e2e3c', '#17171f']
const BANANA: Paint = ['#fff59a', '#ffd93b', '#d9a21a']
const MELON: Paint = ['#ff9a9a', '#ff4b5c', '#c2263b']
const CARROT: Paint = ['#ffb35c', '#ff8a1f', '#c95a12']
const CHEESE: Paint = ['#fff2a0', '#ffd04a', '#e0a024']
const CANDY: Paint = ['#ffd1e6', '#ff6fb0', '#c43a7a']
const GEM: Paint = ['#e2fcff', '#5ce1f5', '#1f9ac9']
const WING: Paint = ['#ffd27a', '#ffa630', '#d0661a']
const GHOST: Paint = ['#ffffff', '#eef0ff', '#a9b0d6']
const SATURN: Paint = ['#ffd6a0', '#f4a24a', '#b8662a']
const RING: Paint = ['#fff3c4', '#e8d07a', '#b09a4a']
const SOLAR: Paint = ['#8fbaff', '#3a66e0', '#1f3a9a']

/** Глаз-бусинка 2×3 с бликом. */
const BEAD = ['wk', 'kk', 'kk']
/** Большой глаз-фасолина 4×5, блик со всех сторон в тёмном. */
const EYE = ['.kk.', 'kwkk', 'kkkk', 'kkkk', '.kk.']
/** Зрачок 2×2 с бликом. */
const PUPIL = ['wk', 'kk']

// ===== Рисунки =====

const ART: Record<string, (p: Px) => unknown> = {
  колобок: (p) =>
    p
      .fill(circle(12, 12.5, 10.5), YELLOW)
      .dots('#fffbe0', [5, 6], [6, 5], [5, 7], [7, 5])
      .stamp2(8, 9, BEAD)
      .dots2(BLUSH, [5, 13], [6, 13])
      .dots2(INK, [9, 14], [10, 15], [11, 15]),

  кот: (p) =>
    p
      .fill(pair(poly([2.5, 13], [3.5, 1.5], [11, 7.5])), ORANGE)
      .fill(pair(poly([4.2, 10], [4.6, 3.8], [9.5, 7.8])), '#ff9cbc', { line: false })
      .fill(ellipse(12, 14.5, 10.5, 8), ORANGE)
      .dots2('#c4561b', [11, 7], [11, 8], [8, 8], [8, 9])
      .fill(ellipse(12, 18.6, 4.6, 2.7), CREAM, { line: false })
      .stamp2(7, 12, ['wkg', 'gkg', 'gkg'], { g: '#b4ea64' })
      .dots2('#ff7aa5', [11, 16])
      .dots2(INK, [11, 17], [10, 18]),

  лиса: (p) =>
    p
      .fill(pair(poly([2.2, 1.2], [11, 8.5], [2.8, 12])), FOX)
      .fill(pair(poly([3.8, 4.2], [8.6, 8.3], [4.2, 9.8])), '#5e3720', { line: false })
      .fill(poly([1.5, 11.5], [5, 8], [12, 7.3], [19, 8], [22.5, 11.5], [21, 15.5], [12, 22.6], [3, 15.5]), FOX)
      .fill(pair(poly([1.8, 12.5], [9, 15], [12, 22.6], [4, 16.5])), CREAM, { line: false })
      .stamp2(7, 11, BEAD)
      .stamp2(11, 19, ['w', 'k']),

  лягушка: (p) =>
    p
      .fill(or(pair(circle(6.5, 6.5, 4.5)), ellipse(12, 15, 10.5, 7.5)), GREEN)
      .fill(ellipse(12, 18.2, 6.5, 3.2), '#d8f5ac', { line: false })
      .stamp2(5, 4, EYE)
      .dots2(BLUSH, [4, 14], [5, 14])
      .dots2(INK, [6, 15], [7, 16], [8, 16], [9, 16], [10, 16], [11, 16]),

  робот: (p) =>
    p
      .fill(box(11, 3.5, 13, 6), GREY)
      .fill(circle(12, 2.6, 1.8), RED)
      .fill(pair(box(1, 10, 3.5, 16, 1)), GREY)
      .fill(box(3, 5.5, 21, 21.5, 4), METAL)
      .fill(box(5.5, 8.5, 18.5, 15, 2), '#1f2a44')
      .stamp2(8, 10, ['ws', 'ss', 'ss'], { s: '#5ccdf2' })
      .fill(box(8, 17.5, 16, 19.5), '#565c75', { line: false })
      .dots2('#c3c8d9', [10, 18], [10, 19]),

  пингвин: (p) =>
    p
      .fill(pair(poly([4.5, 10.5], [1, 17], [3, 19.5], [5.5, 14])), NAVY)
      .fill(ellipse(12, 12, 8.5, 10), NAVY)
      .fill(ellipse(12, 14.6, 5.8, 7.2), CREAM, { line: false })
      .stamp2(8, 9, BEAD)
      .fill(poly([9.6, 13], [14.4, 13], [12, 16]), '#ffb12e')
      .dots2(BLUSH, [7, 14])
      .fill(pair(ellipse(8.5, 22, 2.6, 1.3)), '#ff9a2e'),

  корзинка: (p) =>
    p
      .fill(and(circle(12, 10, 8.2), not(circle(12, 10, 6)), above(10)), WOOD)
      .fill(poly([2, 11], [22, 11], [19.5, 22], [4.5, 22]), WOOD)
      .dots2('#8a4f22', ...[4, 5, 6, 7, 9, 10].map((x) => [x, 16] as Pt), ...[6, 7, 9, 10].map((x) => [x, 19] as Pt))
      .dots2('#8a4f22', [8, 14], [8, 15], [8, 17], [8, 18], [8, 20], [11, 14], [11, 15], [11, 17], [11, 18], [11, 20])
      .fill(box(1, 9, 23, 12.5, 1.5), WOOD),

  яблоко: (p) =>
    p
      .fill(box(11.2, 2, 12.8, 7.5), '#8a4f22')
      .fill(poly([13.5, 4.5], [16.5, 1.5], [21, 2], [18, 5.5]), LEAF)
      .fill(or(pair(circle(8.2, 13.5, 7.3)), ellipse(12, 17, 8.5, 5.5)), RED)
      .dots('#ffd3cb', [5, 10], [5, 11], [6, 9], [5, 12]),

  груша: (p) =>
    p
      .fill(box(11.2, 1.5, 12.8, 5), '#8a4f22')
      .fill(poly([13, 3.5], [16, 1], [20, 1.5], [17, 4.5]), LEAF)
      .fill(or(circle(12, 15.5, 7.2), ellipse(12, 8.5, 4.2, 5)), PEAR)
      .dots('#f5ffd0', [7, 13], [7, 14], [8, 12], [7, 15])
      .dots('#6e9a2c', [14, 17], [10, 19], [13, 12]),

  вишня: (p) =>
    p
      .fill(or(stroke(1.2, [7, 14], [9, 8], [14.5, 3]), stroke(1.2, [16.5, 14], [16, 8], [14.5, 3])), '#3f8f3a')
      .fill(poly([14.5, 3], [18, 0.8], [22, 1.5], [19, 4.5]), LEAF)
      .fill(circle(7, 17.3, 5.3), CHERRY)
      .fill(circle(16.5, 17.8, 5), CHERRY)
      .dots('#ffd0d6', [4, 15], [5, 14], [14, 15], [15, 14]),

  клубника: (p) =>
    p
      .fill(or(ellipse(12, 11, 9.5, 5), poly([2.6, 11], [21.4, 11], [16.5, 19], [12, 22.5], [7.5, 19])), RED)
      .dots('#ffe58a', [6, 11], [10, 11], [14, 12], [18, 11], [8, 14], [12, 15], [16, 14], [10, 18], [14, 18], [12, 20])
      .fill(
        poly(
          [4.5, 6.5],
          [8.5, 6.5],
          [7.5, 2],
          [10.8, 5],
          [12, 0.8],
          [13.2, 5],
          [16.5, 2],
          [15.5, 6.5],
          [19.5, 6.5],
          [15, 9.3],
          [9, 9.3],
        ),
        LEAF,
      )
      .dots('#ffd0cb', [4, 12], [4, 13], [5, 14]),

  пончик: (p) =>
    p
      .fill(and(circle(12, 12.5, 10.5), not(circle(12, 12, 2.6))), DOUGH)
      .fill(
        and(circle(12, 12.5, 9.5), not(circle(12, 12, 2.6)), (x, y) => y < 13.5 + 1.3 * Math.sin(x * 1.25)),
        ICING,
        { line: false, depth: 1 },
      )
      .dots('#5ccdf2', [7, 5], [15, 9])
      .dots('#ffe066', [16, 4], [6, 10])
      .dots('#9be05a', [11, 4], [18, 8])
      .dots(WHITE, [5, 7], [13, 6])
      .dots('#ffe6f0', [5, 4], [4, 5]),

  рыба: (p) =>
    p
      .fill(poly([6, 7.5], [8.5, 3], [13.5, 4], [14, 7.5]), '#2f8fd8')
      .fill(poly([15.5, 12.5], [22.5, 5.5], [21, 12.5], [22.5, 19.5]), '#2f8fd8')
      .fill(ellipse(10, 12.5, 8.8, 6.3), SKY)
      .dots('#2585cf', [11, 8], [10, 9], [10, 10], [10, 11], [10, 12], [10, 13], [10, 14], [10, 15], [11, 16])
      .stamp(4, 10, PUPIL)
      .dots(INK, [2, 14], [3, 14]),

  бомба: (p) =>
    p
      .fill(stroke(1.2, [15, 7], [18, 4], [20, 3.5]), '#d9b77a')
      .fill(poly([12.5, 5.5], [16, 3.5], [18.5, 7.5], [15, 9.5]), GREY)
      .fill(circle(10.5, 14, 8.5), COAL)
      .dots('#b8bdd0', [6, 9], [7, 8], [6, 10], [5, 11])
      .stamp(19, 0, ['.y.', 'yWy', '.y.'], { y: '#ffb02e', W: '#fff6c8' })
      .dots('#ff6a2e', [22, 0], [22, 3], [18, 0]),

  звезда: (p) =>
    p
      .fill(star(12, 13, 11, 5.2), YELLOW)
      .dots('#fffbe0', [10, 5], [10, 6], [11, 4])
      .stamp2(9, 11, ['k', 'k'])
      .dots2(INK, [10, 14], [11, 15]),

  монетка: (p) =>
    p
      .fill(circle(12, 12, 10.5), GOLD)
      .fill(and(circle(12, 12, 7.8), not(circle(12, 12, 6.7))), '#d4851a', { line: false })
      .fill(star(12, 12.4, 5, 2.2), '#e8961c', { line: false })
      .dots('#fffbe0', [5, 6], [6, 5], [5, 7], [7, 4]),

  сердце: (p) =>
    p
      .fill(or(pair(circle(7.4, 8.4, 5.6)), poly([2.1, 10], [21.9, 10], [12, 21.6])), ROSE)
      .dots('#ffe0e6', [5, 5], [4, 6], [6, 5], [4, 7]),

  молния: (p) =>
    p
      .fill(poly([15, 1], [4.5, 13.5], [11, 13.5], [8, 22.8], [19.5, 9], [13, 9], [17.5, 1]), YELLOW, { depth: 1 })
      .dots('#fffbe0', [13, 4], [12, 5], [11, 6]),

  цыплёнок: (p) =>
    p
      .fill(poly([9, 5.5], [8.6, 1.5], [10.8, 3.4], [12.6, 1], [13.6, 5.5]), YELLOW)
      .fill(pair(ellipse(8, 22, 2.4, 1.2)), '#ff9a2e')
      .fill(ellipse(11, 13, 9.5, 9), YELLOW)
      .fill(poly([19.5, 10.5], [23.2, 12.6], [19.5, 14.8]), '#ff9a2e')
      .fill(ellipse(6.8, 14.2, 4.3, 3), ['#ffe27a', '#ffbe2a', '#e08a12'], { depth: 1 })
      .stamp(15, 9, BEAD)
      .dots(BLUSH, [16, 13], [17, 13]),

  птичка: (p) =>
    p
      .fill(poly([4.5, 11], [0.8, 7.5], [1.5, 13], [0.8, 17.5], [4.5, 15]), '#2f55c4')
      .fill(pair(ellipse(8.5, 22, 2.3, 1.2)), '#ffb12e')
      .fill(ellipse(12, 13, 9, 8.6), BLUE)
      .fill(ellipse(13.5, 17.2, 5.2, 3), '#e9f1ff', { line: false })
      .fill(poly([20, 10.5], [23.4, 12.5], [20, 14.5]), '#ffb12e')
      .fill(ellipse(7.6, 14, 4.6, 3), BLUE_WING, { depth: 1 })
      .stamp(15, 7, EYE),

  сова: (p) =>
    p
      .fill(pair(poly([3, 9], [3, 1.2], [8.5, 5])), OWL)
      .fill(ellipse(12, 13, 10, 9.5), OWL)
      .fill(ellipse(12, 18, 5.5, 4.4), '#f2d2a6', { line: false })
      .dots2('#c48a55', [9, 17], [10, 18], [11, 17])
      .fill(pair(circle(8, 9.5, 4.3)), '#f2d2a6', { line: false })
      .fill(pair(circle(8, 9.5, 3.3)), '#ffcd38', { line: false })
      .stamp2(6, 7, EYE)
      .fill(poly([10.5, 12.5], [13.5, 12.5], [12, 15.5]), '#ffb12e'),

  пчела: (p) =>
    p
      .fill(ellipse(8, 5.5, 3.3, 4.3), ['#ffffff', '#dff4ff', '#a9d4ee'], { depth: 1 })
      .fill(ellipse(14, 5, 3.3, 4.3), ['#ffffff', '#dff4ff', '#a9d4ee'], { depth: 1 })
      .fill(poly([0.6, 14], [2.8, 12.6], [2.8, 15.4]), INK)
      .fill(ellipse(11.8, 14, 9.8, 7.5), YELLOW)
      .fill(
        and(ellipse(11.8, 14, 9.8, 7.5), (x) => (x > 6.5 && x < 9) || (x > 12 && x < 14.5)),
        INK,
        { line: false },
      )
      .stamp(16, 10, EYE)
      .dots(BLUSH, [19, 16], [20, 16])
      .dots(INK, [18, 7], [19, 6], [19, 5], [20, 4], [21, 4]),

  мышь: (p) =>
    p
      .fill(
        pair(poly([10, 9.5], [6, 5.5], [0.8, 7.5], [2, 11], [0.8, 15.5], [4, 13.5], [6, 16.5], [8, 14], [10.5, 15.5])),
        ['#7a4fbf', '#5c3591', '#3d2266'],
        { depth: 1 },
      )
      .fill(pair(poly([8, 7.5], [7.6, 2], [11, 5.5])), PURPLE)
      .fill(ellipse(12, 12.5, 5.6, 6.5), PURPLE)
      .stamp2(9, 10, ['yy', 'yk'], { y: '#ffe066' })
      .dots2(INK, [10, 15], [11, 15])
      .dots2(WHITE, [10, 16]),

  дракон: (p) =>
    p
      .fill(pair(poly([6, 7], [3.2, 1.2], [9.5, 4.5])), ['#ffffff', '#fff1dc', '#d9c2a0'], { depth: 1 })
      .fill(pair(poly([3, 13], [0.8, 8.5], [5.5, 9.5])), LEAF, { depth: 1 })
      .fill(poly([9, 5.5], [10, 2.2], [11.2, 4.5], [12, 1.5], [12.8, 4.5], [14, 2.2], [15, 5.5]), '#ff8a2e')
      .fill(ellipse(12, 12.5, 9.5, 8.5), GREEN)
      .fill(ellipse(12, 17.3, 6, 3.8), ['#e4ffc2', '#c6f297', '#93cf62'], { depth: 1 })
      .dots2(INK, [10, 16])
      .stamp2(6, 8, EYE)
      .dots2(INK, [10, 19], [11, 19]),

  ракета: (p) =>
    p
      .fill(poly([9.5, 19], [12, 23.5], [14.5, 19]), FIRE, { depth: 1 })
      .dots('#fff4b0', [11, 20], [12, 20], [11, 21], [12, 21])
      .fill(pair(poly([8.2, 12.5], [3, 17.5], [3.5, 21], [8.5, 18.5])), RED, { depth: 1 })
      .fill(poly([12, 1], [15.5, 4.5], [16.5, 10], [16, 19.5], [8, 19.5], [7.5, 10], [8.5, 4.5]), METAL)
      .fill(and(poly([12, 1], [15.5, 4.5], [16.5, 10], [7.5, 10], [8.5, 4.5]), above(6)), RED, { depth: 1 })
      .fill(circle(12, 11, 2.5), GLASS, { depth: 1 })
      .dots(WHITE, [11, 10])
      .dots2('#a9b0c8', [10, 16], [10, 17]),

  тарелка: (p) =>
    p
      .fill(pair(stroke(1.2, [7, 15], [4.5, 20])), GREY)
      .fill(and(circle(12, 10, 6), above(10.5)), GLASS, { depth: 1 })
      .stamp(11, 6, ['gg', 'kk'], { g: '#9be05a' })
      .dots2('#9be05a', [11, 8])
      .fill(ellipse(12, 12.5, 10.8, 3.8), ['#ffffff', '#c3c8d9', '#6b7290'], { depth: 1 })
      .dots2('#ffd23f', [5, 13])
      .dots2('#ff5b4f', [11, 14])
      .dots2('#9be05a', [8, 14]),

  пришелец: (p) =>
    p
      .fill(
        or(
          and(ellipse(12, 11.5, 10, 7.5), above(12)),
          box(2, 11, 22, 17),
          poly(
            [2, 16],
            [2, 20],
            [4.5, 17.5],
            [7, 21.5],
            [9.5, 17.5],
            [12, 22],
            [14.5, 17.5],
            [17, 21.5],
            [19.5, 17.5],
            [22, 20],
            [22, 16],
          ),
        ),
        VIOLET,
      )
      .fill(pair(stroke(1.3, [4, 3], [6.5, 6.2])), '#7a45c9')
      .fill(pair(circle(3.5, 2.2, 1.7)), ['#e4ffb0', '#9be05a', '#5fa83a'], { depth: 1 })
      .fill(pair(ellipse(8, 11, 2.4, 3)), '#e9ff9a')
      .stamp2(8, 10, ['k', 'k'])
      .dots2(WHITE, [7, 10]),

  осьминог: (p) =>
    p
      .fill(pair(or(stroke(2.8, [6.5, 13], [4.5, 18.5], [2.8, 21.4]), stroke(2.8, [10, 15], [9.6, 21.4]))), PINK, {
        depth: 1,
      })
      .fill(ellipse(12, 9.4, 9.6, 8.2), PINK)
      .dots('#ffe2ee', [6, 3], [5, 4], [16, 3], [18, 5])
      .stamp2(6, 7, EYE)
      .dots2(BLUSH, [5, 13], [6, 13])
      .dots2(INK, [10, 13], [11, 14]),

  астероид: (p) =>
    p
      .fill(poly([7, 2.5], [14, 1.6], [20, 5], [22.4, 12], [20, 19.5], [13, 22.4], [6, 21], [1.6, 15], [2, 7.5]), ROCK)
      .fill(circle(14.5, 8, 2.6), CRATER, { line: false, depth: 1 })
      .fill(circle(8, 15, 3), CRATER, { line: false, depth: 1 })
      .fill(circle(16.5, 16, 1.6), CRATER, { line: false, depth: 1 })
      .dots('#e8e0d4', [5, 6], [6, 5], [4, 7]),

  взрыв: (p) =>
    p
      .fill(star(12, 12, 11.4, 6.5, 12), ['#ff8a4a', '#ff5b2e', '#d43a1c'], { depth: 1 })
      .fill(star(12, 12, 8, 4.8, 10, -72), '#ffa02e', { line: false })
      .fill(star(12, 12, 5.2, 3.2, 8), '#ffe066', { line: false })
      .fill(circle(12, 12, 1.8), '#fffbe0', { line: false }),

  луна: (p) =>
    p
      .fill(and(circle(10.5, 12.5, 10), not(circle(17, 8, 8.5))), ['#fff6c4', '#ffd95a', '#d9a32a'])
      .dots('#ebbd42', [6, 6], [7, 6], [4, 15], [9, 19], [10, 19])
      .dots('#fffbe0', [5, 4], [4, 5])
      .dots(INK, [4, 11], [5, 10], [6, 11])
      .dots(BLUSH, [4, 13], [5, 13])
      .dots(INK, [6, 15], [7, 16], [8, 16], [9, 15]),

  собака: (p) =>
    p
      .fill(ellipse(12, 12.5, 9, 8.6), TAN)
      .fill(ellipse(16, 9.6, 3, 2.6), '#a8672e', { line: false })
      .fill(ellipse(12, 16.6, 5.2, 3.6), CREAM, { line: false })
      .fill(pair(ellipse(3.7, 12.5, 2.9, 6.2)), BROWN, { depth: 1 })
      .stamp2(7, 9, BEAD)
      .stamp(10, 14, ['kwkk', '.kk.'])
      .dots2(INK, [10, 17])
      .dots(INK, [11, 16], [12, 16])
      .dots('#ff7aa5', [11, 18], [12, 18]),

  заяц: (p) =>
    p
      .fill(pair(ellipse(8.2, 7, 2.7, 6)), SNOW, { depth: 1 })
      .fill(pair(ellipse(8.2, 7.6, 1.1, 4)), '#ffb3cd', { line: false })
      .fill(ellipse(12, 16, 9, 7.2), SNOW)
      .stamp2(7, 13, BEAD)
      .dots2(BLUSH, [5, 17], [6, 17])
      .dots2('#ff7aa5', [11, 17])
      .dots2(INK, [11, 18], [10, 19]),

  мишка: (p) =>
    p
      .fill(pair(circle(5, 5, 3.4)), BROWN)
      .fill(pair(circle(5, 5, 1.6)), '#e0a464', { line: false })
      .fill(ellipse(12, 13.5, 10, 8.8), BROWN)
      .fill(ellipse(12, 17.2, 4.8, 3.4), '#f2cf9e', { line: false })
      .stamp2(7, 10, BEAD)
      .stamp(10, 15, ['kwkk', '.kk.'])
      .dots2(INK, [11, 17], [10, 18]),

  панда: (p) =>
    p
      .fill(pair(circle(4.6, 4.8, 3.4)), SOOT)
      .fill(ellipse(12, 13, 10, 9), SNOW)
      .fill(pair(ellipse(7.8, 12, 2.7, 3.3)), '#2e2e3c', { line: false })
      .stamp2(7, 11, ['ww', 'wk'])
      .dots(INK, [11, 15], [12, 15])
      .dots2(INK, [11, 16], [10, 17])
      .dots2(BLUSH, [4, 16], [5, 16]),

  банан: (p) =>
    p
      .fill(stroke(5.4, [5.5, 5.5], [6.5, 12], [10.5, 17], [19.5, 19]), BANANA)
      .fill(stroke(1.6, [7.5, 6], [8.5, 12], [12, 15.5]), '#fff9c8', { line: false })
      .fill(box(4, 1.2, 6.6, 4.4), '#8a6a2a')
      .dots(INK, [21, 19]),

  арбуз: (p) =>
    p
      .fill(
        and(circle(12, 6.5, 11), (_x, y) => y > 6.5),
        GREEN,
      )
      .fill(
        and(circle(12, 6.5, 9.7), (_x, y) => y > 6.5),
        '#eaffd2',
        { line: false },
      )
      .fill(
        and(circle(12, 6.5, 8.6), (_x, y) => y > 6.5),
        MELON,
        { line: false },
      )
      .dots(INK, [7, 9], [11, 10], [15, 9], [9, 13], [14, 13], [12, 15]),

  морковка: (p) =>
    p
      .fill(or(ellipse(10, 5, 1.8, 4.4), ellipse(14, 5, 1.8, 4.4), ellipse(12, 4, 1.8, 3.8)), LEAF, { depth: 1 })
      .fill(poly([6.5, 8.5], [17.5, 8.5], [13.2, 20.5], [11.5, 22.8], [10.8, 20.5]), CARROT)
      .dots('#c95a12', [9, 12], [10, 12], [13, 15], [14, 15], [10, 18], [11, 18]),

  пицца: (p) =>
    p
      .fill(poly([3, 5], [21, 5], [12, 22.8]), CHEESE)
      .fill(box(2, 2, 22, 6.8, 2.4), DOUGH)
      .fill(circle(9, 10.5, 2.3), RED, { line: false, depth: 1 })
      .fill(circle(15, 10, 2.3), RED, { line: false, depth: 1 })
      .fill(circle(12, 15.5, 2.1), RED, { line: false, depth: 1 })
      .dots('#7fbf4a', [6, 8], [17, 13], [11, 19]),

  конфета: (p) =>
    p
      .fill(pair(poly([1.2, 6.8], [7.5, 10.2], [7.5, 13.8], [1.2, 17.2])), CANDY, { depth: 1 })
      .fill(ellipse(12, 12, 6.4, 5.6), CANDY)
      .fill(
        and(ellipse(12, 12, 6.4, 5.6), (x, y) => (x + y) % 4 < 1.6),
        WHITE,
        { line: false },
      )
      .dots2('#ffe6f0', [3, 9], [3, 10]),

  алмаз: (p) =>
    p
      .fill(poly([7, 4], [17, 4], [22.2, 9.5], [12, 21.8], [1.8, 9.5]), GEM)
      .fill(poly([9, 4.5], [15, 4.5], [16.5, 9], [7.5, 9]), '#c9f8ff', { line: false })
      .dots('#2bb3d9', ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((x) => [x, 9] as Pt))
      .dots('#2bb3d9', [11, 11], [11, 12], [11, 13], [12, 14], [12, 15], [12, 16])
      .dots(WHITE, [5, 7], [6, 6]),

  ключ: (p) =>
    p
      .fill(or(box(10, 9.8, 22, 12.6), box(16.6, 12, 18.8, 16), box(20, 12, 22, 15)), GOLD, { depth: 1 })
      .fill(and(circle(7, 11.2, 5.8), not(circle(7, 11.2, 2.2))), GOLD)
      .dots('#fffbe0', [4, 8], [5, 7]),

  гриб: (p) =>
    p
      .fill(box(7.5, 11, 16.5, 22, 3), ['#ffffff', '#fff1dc', '#d9c2a0'])
      .fill(and(ellipse(12, 11.5, 10.8, 9.5), above(12.5)), RED)
      .fill(circle(7.5, 7, 1.9), WHITE, { line: false })
      .fill(circle(14.5, 5, 1.7), WHITE, { line: false })
      .fill(circle(18, 9.5, 1.6), WHITE, { line: false })
      .fill(circle(11, 9.5, 1.3), WHITE, { line: false })
      .stamp2(9, 15, BEAD)
      .dots2(BLUSH, [8, 19]),

  подарок: (p) =>
    p
      .fill(pair(poly([12, 7], [6.5, 1.6], [4.2, 4.5], [7.5, 7])), GOLD, { depth: 1 })
      .fill(box(3, 10, 21, 22.2), RED)
      .fill(box(1.6, 6.5, 22.4, 10.5), RED)
      .fill(box(10.4, 6.5, 13.6, 22.2), GOLD, { line: false, body: box(1.6, 6.5, 22.4, 22.2) })
      .dots(INK, [10, 10], [11, 10], [12, 10], [13, 10]),

  мяч: (p) =>
    p
      .fill(circle(12, 12, 10.6), SNOW)
      .fill(
        and(
          circle(12, 12, 10.6),
          (x, y) => Math.floor(((Math.atan2(y - 12, x - 12) + Math.PI) / Math.PI) * 3) % 3 === 0,
        ),
        RED,
        { line: false, body: circle(12, 12, 10.6) },
      )
      .fill(
        and(
          circle(12, 12, 10.6),
          (x, y) => Math.floor(((Math.atan2(y - 12, x - 12) + Math.PI) / Math.PI) * 3) % 3 === 1,
        ),
        SOLAR,
        { line: false, body: circle(12, 12, 10.6) },
      )
      .fill(circle(12, 12, 2.2), SNOW, { line: false })
      .dots(WHITE, [6, 5], [5, 6]),

  труба: (p) =>
    p
      .fill(box(6, 8, 18, 22.6), GREEN)
      .fill(box(8, 9, 9.6, 22.6), '#c9f7a8', { line: false })
      .fill(box(3.4, 2.4, 20.6, 8.6, 1), GREEN)
      .fill(box(5.4, 3.6, 7, 7.6), '#c9f7a8', { line: false }),

  бабочка: (p) =>
    p
      .fill(pair(ellipse(6.4, 8, 5.6, 5.6)), WING)
      .fill(pair(ellipse(7.6, 16.2, 4.2, 4.6)), WING)
      .fill(pair(circle(5.5, 7.5, 1.2)), WHITE, { line: false })
      .fill(pair(circle(7, 16.5, 1.3)), '#7a3f12', { line: false })
      .fill(ellipse(12, 13, 1.8, 8), SOOT)
      .fill(circle(12, 5.2, 2), SOOT)
      .dots2(INK, [10, 2], [9, 1])
      .dots2(WHITE, [11, 5]),

  'божья коровка': (p) =>
    p
      .fill(circle(12, 6, 4.6), SOOT)
      .fill(circle(12, 13.6, 9), RED)
      .fill(box(11.4, 4.8, 12.6, 22.6), INK, { line: false })
      .fill(pair(circle(7, 11, 1.9)), INK, { line: false })
      .fill(pair(circle(8, 17, 1.6)), INK, { line: false })
      .dots2(WHITE, [10, 4])
      .dots(WHITE, [6, 8], [5, 9]),

  призрак: (p) =>
    p
      .fill(
        or(
          and(circle(12, 10.5, 8.6), above(10.5)),
          box(3.4, 10, 20.6, 18.5),
          poly([3.4, 18], [3.4, 22], [6.3, 19.5], [9, 22], [12, 19.5], [15, 22], [17.7, 19.5], [20.6, 22], [20.6, 18]),
        ),
        GHOST,
      )
      .stamp2(7, 9, EYE)
      .stamp(11, 15, ['kk', 'kk'])
      .dots2(BLUSH, [6, 15]),

  шарик: (p) =>
    p
      .fill(ellipse(12, 9.4, 8, 8.8), RED)
      .fill(poly([10.6, 18.4], [13.4, 18.4], [12, 20.2]), RED, { depth: 1 })
      .dots('#d0d0dc', [12, 21], [11, 22])
      .fill(ellipse(8, 6, 1.6, 2.6), '#ffd3cb', { line: false }),

  комета: (p) =>
    p
      .fill(poly([13, 5.5], [1.5, 20.5], [4, 22.5], [19, 12]), ['#e8fbff', '#8fe0f5', '#3fa9d6'], { depth: 1 })
      .fill(poly([14, 8], [5, 19], [16, 11]), '#e8fbff', { line: false })
      .fill(circle(16.5, 7.5, 5), ['#ffffff', '#fff6c4', '#ffc632'])
      .dots(WHITE, [14, 5], [15, 4]),

  планета: (p) =>
    p
      .fill(and(ellipse(12, 12.5, 11.6, 3.6), not(ellipse(12, 12.5, 8.4, 1.8))), RING, { depth: 1 })
      .fill(circle(12, 12, 7.8), SATURN)
      .fill(
        and(circle(12, 12, 7.8), (_x, y) => y > 14 && y < 16),
        '#d98a3a',
        { line: false },
      )
      .fill(
        and(ellipse(12, 12.5, 11.6, 3.6), not(ellipse(12, 12.5, 8.4, 1.8)), (_x, y) => y > 12.5),
        RING,
        { depth: 1 },
      )
      .dots('#fff1dc', [8, 7], [9, 6]),

  спутник: (p) =>
    p
      .fill(pair(box(1.2, 8.5, 7.4, 15.5)), SOLAR, { depth: 1 })
      .dots2('#1f3a9a', [4, 9], [4, 10], [4, 11], [4, 12], [4, 13], [4, 14], [2, 12], [3, 12], [5, 12], [6, 12])
      .fill(box(7, 11.2, 17, 12.8), GREY)
      .fill(box(9, 7.5, 15, 16.5, 1.5), METAL)
      .fill(circle(12, 11, 1.8), GLASS, { depth: 1 })
      .fill(box(11.4, 3, 12.6, 7), GREY)
      .fill(circle(12, 2.4, 1.5), RED, { depth: 1 }),

  '?': (p) =>
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
      ]),
}

// ===== Готовые рисунки =====

const grids = new Map<string, (string | null)[]>()

/** Клетки рисунка: N строк по N цветов, null — пусто. Неизвестное имя — рисунок «?». */
export function pictureGrid(name: string): (string | null)[][] {
  const key = Object.hasOwn(ART, name) ? name : UNKNOWN_PICTURE
  let cells = grids.get(key)
  if (!cells) {
    const p = new Px()
    ART[key](p)
    cells = p.cells
    grids.set(key, cells)
  }
  return Array.from({ length: N }, (_, y) => cells.slice(y * N, y * N + N))
}

export const isPicture = (name: string) => name !== UNKNOWN_PICTURE && Object.hasOwn(ART, name)

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
