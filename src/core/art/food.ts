import {
  type Art,
  type Paint,
  type Pt,
  type Shape,
  BANANA,
  CANDY,
  CARROT,
  CHEESE,
  CHERRY,
  DOUGH,
  GREEN,
  ICING,
  INK,
  LEAF,
  MELON,
  PEAR,
  RED,
  WHITE,
  above,
  and,
  box,
  circle,
  ellipse,
  not,
  or,
  pair,
  poly,
  star,
  stroke,
} from '../pixels.ts'

// Еда.

const CRUST: Paint = ['#f2c27a', '#d08a3c', '#8a4f22']
const MEAT: Paint = ['#f5b26a', '#d4782e', '#8f4416']
const BONE_FOOD: Paint = ['#ffffff', '#f1ead8', '#b3a88e']
const BUN: Paint = ['#ffd08a', '#eaa04a', '#a8621f']
const CHEESE_SLICE: Paint = ['#fff2a0', '#ffd23f', '#e0a024']
const LETTUCE: Paint = ['#b6f07a', '#5cc44a', '#2f8a3a']
const FRIES: Paint = ['#fff4a8', '#ffd23f', '#d9a21a']
const SPONGE: Paint = ['#fff1d4', '#f6d39c', '#c4955a']
const ICING_CAKE: Paint = ['#ffe0ee', '#ff9cc6', '#e05a96']
const CHERRY_TOP: Paint = ['#ff8a96', '#e5223f', '#9c1030']
const WRAPPER: Paint = ['#a8d8ff', '#5aaef5', '#2f6fc4']
const WAFFLE: Paint = ['#ffd99a', '#e8ad67', '#b5763a']
const MINT: Paint = ['#d6fff0', '#7fe8c4', '#3cb08c']
const CHOCO: Paint = ['#a8673e', '#7a4424', '#4a2410']
const WRAPPER_RED: Paint = ['#ff7d6f', '#e5323b', '#9c1730']
const MUG: Paint = ['#ffffff', '#e9eef7', '#a9b3c9']
/** Изогнутая линия по кривой Безье через `a`, `b`, `c`: толщина w посередине и сходит на нет к концам. */
function curve(w: number, a: Pt, b: Pt, c: Pt): Shape {
  const pts = Array.from({ length: 48 }, (_, i) => {
    const t = i / 47
    const u = 1 - t
    return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1], t] as const
  })
  return (x, y) =>
    pts.some(([px, py, t]) => (x - px) ** 2 + (y - py) ** 2 <= ((w / 2) * Math.sin(Math.PI * t) ** 0.7 + 0.5) ** 2)
}

export const FOOD: Record<string, Art> = {
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

  // изогнутая линия: толстая посередине, к концам тоньше
  банан: (p) =>
    p
      .fill(stroke(1.6, [19.5, 6], [20.8, 1.5]), '#8a6a2a', { depth: 0 })
      .fill(curve(7.4, [19.5, 5.5], [17.5, 20.5], [2.5, 14.5]), BANANA)
      .fill(curve(1.4, [18.4, 8.5], [15.6, 16.6], [5.5, 14]), '#fff6b0', { line: false, depth: 0 })
      .dots('#5e3d14', [1, 14], [2, 15], [1, 15]),

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

  сыр: (p) =>
    p
      .fill(poly([1.5, 12.5], [17, 4], [22.5, 10], [22.5, 20.5], [1.5, 20.5]), CHEESE)
      .fill(poly([2.5, 12.5], [17, 5], [21.5, 10.5]), '#fff2a0', { line: false })
      .fill(circle(7, 16, 1.8), '#e0a024', { line: false, depth: 1 })
      .fill(circle(14.5, 15, 2.4), '#e0a024', { line: false, depth: 1 })
      .fill(circle(19.5, 18.5, 1.3), '#e0a024', { line: false, depth: 1 })
      .fill(circle(17, 9, 1.2), '#e0a024', { line: false, depth: 1 }),

  хлеб: (p) =>
    p
      .fill(or(ellipse(12, 11, 10.5, 6.5), box(1.5, 11, 22.5, 19.5, 2.5)), CRUST)
      .fill(box(2.5, 15.5, 21.5, 18.5, 1.5), '#f3c98a', { line: false })
      .fill(
        or(stroke(1.2, [6, 10], [8, 7]), stroke(1.2, [11, 10], [13, 7]), stroke(1.2, [16, 10], [18, 7])),
        '#ffe1aa',
        {
          line: false,
          depth: 0,
        },
      )
      .dots('#ffe9c4', [4, 8], [5, 7]),

  курица: (p) =>
    p
      .fill(or(stroke(3, [13, 13], [18.5, 18.5]), circle(20.5, 17.8, 2.3), circle(17.8, 20.5, 2.3)), BONE_FOOD, {
        depth: 1,
      })
      .fill(or(ellipse(9.5, 9.5, 8, 7), ellipse(13, 13, 4, 3.5)), MEAT)
      .dots('#ffd6a0', [5, 5], [6, 4], [4, 6], [7, 4])
      .dots('#a4501c', [9, 12], [12, 9], [6, 11]),

  бургер: (p) =>
    p
      .fill(box(2.5, 17, 21.5, 21.5, 2.5), BUN)
      .fill(box(2, 13.5, 22, 17.5, 2), ['#a8673e', '#7a4424', '#4a2410'])
      .fill(
        poly([2, 13], [22, 13], [20, 16.5], [17, 14.5], [14, 17.5], [11, 14.5], [8, 16.5], [5, 14.5]),
        CHEESE_SLICE,
        {
          depth: 1,
        },
      )
      .fill((x, y) => y > 11 && y < 13.6 + Math.sin(x * 1.6) * 0.7 && x > 1.5 && x < 22.5, LETTUCE, { depth: 1 })
      .fill(and(ellipse(12, 11.5, 10.5, 9), above(12)), BUN)
      .dots('#fff4d8', [7, 6], [11, 5], [15, 6], [9, 8], [13, 8], [17, 8])
      .dots('#ffe1aa', [5, 7], [6, 6]),

  картошка: (p) =>
    p
      .fill(box(5.5, 3.5, 7.5, 13), FRIES, { depth: 1 })
      .fill(box(14.5, 2, 16.5, 13), FRIES, { depth: 1 })
      .fill(box(8.5, 1.5, 10.5, 13), FRIES, { depth: 1 })
      .fill(box(17, 4.5, 19, 13), FRIES, { depth: 1 })
      .fill(box(11.5, 3, 13.5, 13), FRIES, { depth: 1 })
      .fill(poly([3.5, 10.5], [20.5, 10.5], [18.5, 22.5], [5.5, 22.5]), RED)
      .fill(star(12, 16.5, 3.2, 1.4), '#ffffff', { line: false })
      .dots('#ff9f97', [5, 12], [5, 13], [6, 14]),

  торт: (p) =>
    p
      .fill(box(11, 2.5, 13, 7.5), ['#d6f3ff', '#5ccdf2', '#2f8fd8'], { depth: 1 })
      .fill(poly([12, 0.2], [13.2, 1.8], [12, 3], [10.8, 1.8]), '#ffd23f', { line: false })
      .fill(box(2.5, 7.5, 21.5, 21.5, 2.5), SPONGE)
      .fill(box(3, 14, 21, 15.5), '#ff7db1', { line: false })
      .fill(
        (x, y) => x > 2.6 && x < 21.4 && y > 7.6 && y < 10 + ([2, 1, 3, 1, 2][Math.floor(x / 4) % 5] ?? 1),
        ICING_CAKE,
        { line: false, depth: 1 },
      )
      .fill(circle(6, 7, 1.8), CHERRY_TOP, { depth: 1 })
      .fill(circle(18, 7, 1.8), CHERRY_TOP, { depth: 1 })
      .dots('#ffffff', [5, 9], [4, 10]),

  кекс: (p) =>
    p
      .fill(poly([4, 13], [20, 13], [18, 22.5], [6, 22.5]), WRAPPER)
      .dots(
        '#2f8fd8',
        [8, 15],
        [8, 17],
        [8, 19],
        [8, 21],
        [12, 15],
        [12, 17],
        [12, 19],
        [12, 21],
        [16, 15],
        [16, 17],
        [16, 19],
        [16, 21],
      )
      .fill(or(ellipse(12, 12.5, 9.5, 3.4), ellipse(12, 9, 7, 3.4), ellipse(12, 6, 4.4, 2.8)), ICING_CAKE)
      .fill(circle(12, 2.6, 2.2), CHERRY_TOP, { depth: 1 })
      .dots('#ffd23f', [7, 11], [15, 9], [10, 8])
      .dots('#5ccdf2', [16, 12], [9, 12], [13, 6]),

  мороженое: (p) =>
    p
      .fill(poly([6, 12.5], [18, 12.5], [12, 23]), WAFFLE)
      .dots('#b5763a', [9, 14], [11, 16], [13, 14], [15, 14], [12, 18], [10, 14], [14, 16], [12, 20])
      .fill(circle(12, 11, 5.6), MINT)
      .fill(circle(12, 6, 4.8), ICING_CAKE)
      .dots('#ffffff', [10, 3], [9, 4], [8, 9], [9, 10])
      .dots('#7a4424', [13, 10], [15, 12], [11, 13]),

  шоколад: (p) =>
    p
      .fill(box(4, 2, 20, 22, 1.5), CHOCO)
      .fill(
        (x, y) =>
          x > 4.5 && x < 19.5 && y > 2.5 && y < 14 && (Math.floor(x - 4.5) % 5 === 4 || Math.floor(y - 2.5) % 4 === 3),
        '#4a2410',
        { line: false },
      )
      .fill(box(4, 14, 20, 22, 1.5), WRAPPER_RED)
      .fill(box(4, 16.5, 20, 18.5), '#ffd23f', { line: false })
      .dots('#c98a5a', [6, 3], [5, 4]),

  какао: (p) =>
    p
      .dots('#c9cfdc', [8, 1], [7, 2], [7, 3], [8, 4], [8, 5], [13, 1], [12, 2], [12, 3], [13, 4], [13, 5])
      .fill(and(circle(19, 14, 4), not(circle(19, 14, 2.2))), MUG)
      .fill(box(3, 7, 18, 22, 2.5), MUG)
      .fill(box(4, 8, 17, 10.5), '#8a4f22', { line: false })
      .fill(ellipse(8, 8.6, 2, 1.2), '#ffffff', { line: false })
      .fill(ellipse(13, 9, 1.8, 1.1), '#ffe0ee', { line: false })
      .fill(pair(circle(8, 16, 1.5)), '#ff7db1', { line: false }),
}
