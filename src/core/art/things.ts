import {
  type Art,
  type Paint,
  type Pt,
  COAL,
  GOLD,
  GREEN,
  GREY,
  INK,
  METAL,
  RED,
  SNOW,
  SOLAR,
  WHITE,
  WOOD,
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

// Вещи.

const BLADE: Paint = ['#ffffff', '#d3d8e6', '#8890aa']
const HILT: Paint = ['#c98a5a', '#8a4f22', '#4e2a10']
const SHIELD: Paint = ['#93bbff', '#3a66e0', '#1f3a9a']
const PAPER: Paint = ['#fff8e6', '#f2dfb8', '#c9a676']
const PAPER_ROLL: Paint = ['#fff1d4', '#e8c991', '#a8834e']
const BOOK: Paint = ['#ff7d6f', '#c4243a', '#7a1622']
const HOURGLASS: Paint = ['#ffffff', '#d8f2fb', '#8cc2d8']
const SAND: Paint = ['#fff09c', '#ffc632', '#d4851a']
export const THINGS: Record<string, Art> = {
  бомба: (p) =>
    p
      .fill(stroke(1.2, [15, 7], [18, 4], [20, 3.5]), '#d9b77a')
      .fill(poly([12.5, 5.5], [16, 3.5], [18.5, 7.5], [15, 9.5]), GREY)
      .fill(circle(10.5, 14, 8.5), COAL)
      .dots('#b8bdd0', [6, 9], [7, 8], [6, 10], [5, 11])
      .stamp(19, 0, ['.y.', 'yWy', '.y.'], { y: '#ffb02e', W: '#fff6c8' })
      .dots('#ff6a2e', [22, 0], [22, 3], [18, 0]),

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

  шарик: (p) =>
    p
      .fill(ellipse(12, 9.4, 8, 8.8), RED)
      .fill(poly([10.6, 18.4], [13.4, 18.4], [12, 20.2]), RED, { depth: 1 })
      .dots('#d0d0dc', [12, 21], [11, 22])
      .fill(ellipse(8, 6, 1.6, 2.6), '#ffd3cb', { line: false }),

  корзинка: (p) =>
    p
      .fill(and(circle(12, 10, 8.2), not(circle(12, 10, 6)), above(10)), WOOD)
      .fill(poly([2, 11], [22, 11], [19.5, 22], [4.5, 22]), WOOD)
      .dots2('#8a4f22', ...[4, 5, 6, 7, 9, 10].map((x) => [x, 16] as Pt), ...[6, 7, 9, 10].map((x) => [x, 19] as Pt))
      .dots2('#8a4f22', [8, 14], [8, 15], [8, 17], [8, 18], [8, 20], [11, 14], [11, 15], [11, 17], [11, 18], [11, 20])
      .fill(box(1, 9, 23, 12.5, 1.5), WOOD),

  труба: (p) =>
    p
      .fill(box(6, 8, 18, 22.6), GREEN)
      .fill(box(8, 9, 9.6, 22.6), '#c9f7a8', { line: false })
      .fill(box(3.4, 2.4, 20.6, 8.6, 1), GREEN)
      .fill(box(5.4, 3.6, 7, 7.6), '#c9f7a8', { line: false }),

  меч: (p) =>
    p
      .fill(poly([7.5, 14.5], [18.5, 3.5], [22, 2], [20.5, 5.5], [9.5, 16.5]), BLADE)
      .fill(stroke(2.2, [4.5, 12], [12, 19.5]), GOLD, { depth: 1 })
      .fill(stroke(2.4, [7, 17], [3.5, 20.5]), HILT, { depth: 1 })
      .fill(circle(2.6, 21.4, 1.8), GOLD, { depth: 1 })
      .dots('#ffffff', [17, 5], [16, 6], [15, 7]),

  щит: (p) =>
    p
      .fill(or(box(3, 2, 21, 12, 2), poly([3, 11], [21, 11], [12, 22.6])), METAL)
      .fill(or(box(5, 4, 19, 12, 1), poly([5, 11], [19, 11], [12, 20])), SHIELD, { line: false })
      .fill(or(box(11, 4, 13, 19), box(5, 9, 19, 11)), GOLD, { line: false, depth: 1 })
      .dots('#ffffff', [4, 3], [5, 3], [4, 4]),

  лук: (p) =>
    p
      .fill(box(5, 3, 5.9, 21), '#e6e9f0', { line: false })
      .fill(
        and(circle(2, 12, 13), not(circle(2, 12, 11.2)), (x, y) => x > 4.5 && y > 1.6 && y < 22.4),
        WOOD,
        { depth: 1 },
      )
      .fill(stroke(1.2, [3, 12], [19, 12]), '#8a4f22', { depth: 0 })
      .fill(poly([18, 9.5], [22.6, 12], [18, 14.5]), METAL, { depth: 1 })
      .fill(or(poly([3, 12], [1, 9.5], [5, 10.5]), poly([3, 12], [1, 14.5], [5, 13.5])), '#ff5b4f', { depth: 0 }),

  свиток: (p) =>
    p
      .fill(box(4, 5, 20, 19), PAPER)
      .dots('#b39468', [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [13, 8], [14, 8], [15, 8], [16, 8])
      .dots('#b39468', [7, 11], [8, 11], [9, 11], [11, 11], [12, 11], [13, 11], [14, 11], [15, 11], [16, 11])
      .dots('#b39468', [7, 14], [8, 14], [9, 14], [10, 14], [11, 14], [12, 14])
      .fill(box(2.5, 2, 21.5, 5.5, 1.5), PAPER_ROLL)
      .fill(box(2.5, 18.5, 21.5, 22, 1.5), PAPER_ROLL)
      .fill(pair(box(0.8, 2.6, 2.8, 4.9)), '#ff5b4f', { depth: 0 }),

  книга: (p) =>
    p
      .fill(box(5, 2.5, 21, 21.5, 1), '#ffffff')
      .dots('#c9cedd', [20, 5], [20, 8], [20, 11], [20, 14], [20, 17])
      .fill(box(3, 1.5, 19, 21, 1.5), BOOK)
      .fill(box(3, 1.5, 5.5, 21), '#7a1622', { line: false })
      .fill(box(8, 6, 16, 10, 1), GOLD, { line: false, depth: 1 })
      .fill(star(12, 15, 3, 1.3), '#ffd23f', { line: false }),

  часы: (p) =>
    p
      .fill(or(poly([6, 4], [18, 4], [12.8, 12], [18, 20], [6, 20], [11.2, 12])), HOURGLASS)
      .fill(poly([8, 17.5], [16, 17.5], [17, 19.5], [7, 19.5]), SAND, { line: false, depth: 0 })
      .fill(poly([8.5, 6], [15.5, 6], [12.5, 10], [11.5, 10]), SAND, { line: false, depth: 0 })
      .fill(box(11.6, 11, 12.4, 17), '#ffd23f', { line: false })
      .fill(box(3.5, 1.5, 20.5, 4.5, 1), WOOD)
      .fill(box(3.5, 19.5, 20.5, 22.5, 1), WOOD),

  карта: (p) =>
    p
      .fill(poly([2, 4], [8, 2], [16, 4], [22, 2], [22, 20], [16, 22], [8, 20], [2, 22]), PAPER)
      .fill(or(box(7.6, 2.5, 8.4, 20.5), box(15.6, 3.5, 16.4, 21.5)), '#c9a676', { line: false })
      .dots('#e5323b', [4, 18], [5, 16], [7, 15], [9, 14], [10, 12], [12, 11], [13, 9])
      .stamp(14, 4, ['k.k', '.k.', 'k.k'], { k: '#e5323b' })
      .fill(circle(18, 16, 2), '#5cc44a', { line: false, depth: 0 })
      .fill(ellipse(6, 7, 2.5, 1.6), '#5ccdf2', { line: false, depth: 0 }),

  флаг: (p) =>
    p
      .fill(box(4, 2.5, 6, 22.5), WOOD, { depth: 1 })
      .fill(circle(5, 2.4, 1.3), GOLD, { depth: 0 })
      .fill((x, y) => x > 6 && x < 21.5 && y > 3 + Math.sin(x * 0.5) * 1.2 && y < 13 + Math.sin(x * 0.5) * 1.2, RED, {
        depth: 1,
      })
      .fill(star(13, 8, 2.6, 1.1), '#ffd23f', { line: false }),

  бочка: (p) =>
    p
      .fill(or(ellipse(12, 12, 9, 10.5), box(4, 3, 20, 21, 2)), WOOD)
      .fill(or(box(3.5, 6, 20.5, 7.5), box(3.5, 16.5, 20.5, 18)), COAL, { line: false, depth: 1 })
      .dots('#8a4f22', [8, 4], [8, 9], [8, 12], [8, 15], [8, 20], [16, 4], [16, 9], [16, 12], [16, 15], [16, 20])
      .dots('#ffe1aa', [6, 9], [6, 10], [6, 11]),

  ящик: (p) =>
    p
      .fill(box(2, 2, 22, 22, 1), WOOD)
      .fill(box(4.5, 4.5, 19.5, 19.5), '#a8692f', { line: false })
      .fill(or(stroke(2.4, [5, 5], [19, 19]), box(4.5, 4.5, 19.5, 6.5), box(4.5, 17.5, 19.5, 19.5)), WOOD, {
        line: false,
        depth: 1,
      })
      .dots(INK, [3, 3], [20, 3], [3, 20], [20, 20]),
}
