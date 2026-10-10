import {
  type Art,
  type Paint,
  BEAD,
  BLUSH,
  INK,
  LEAF,
  RED,
  WHITE,
  YELLOW,
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

// Природа: погода, стихии, растения.

const SUN_RAYS: Paint = ['#ffd26a', '#ff9a2e', '#e0601a']
const CLOUD: Paint = ['#ffffff', '#eef3fb', '#a9b6cf']
const STORM: Paint = ['#a3abc0', '#6c7590', '#3e4560']
const WATER: Paint = ['#c4ecff', '#3db6ea', '#1c6dbf']
const ICE: Paint = ['#ffffff', '#bfe8ff', '#5aa8e0']
const FLAME: Paint = ['#ff9a5a', '#f25a1f', '#a8300f']
const BARK: Paint = ['#c98a5a', '#8a4f22', '#4e2a10']
const PETAL: Paint = ['#ffd6e8', '#ff7db1', '#d64a86']
const POT: Paint = ['#f2a07a', '#d4683a', '#8f3a1a']
const CACTUS: Paint = ['#a8ee78', '#3fae47', '#22773a']
const SMOKE: Paint = ['#f2f2f6', '#c9cbd6', '#8a8ea0']
const MOUNTAIN: Paint = ['#b58a64', '#7a5232', '#4a2e18']
const LAVA: Paint = ['#ffb35c', '#ff5b2e', '#c4241a']
export const NATURE: Record<string, Art> = {
  молния: (p) =>
    p
      .fill(poly([15, 1], [4.5, 13.5], [11, 13.5], [8, 22.8], [19.5, 9], [13, 9], [17.5, 1]), YELLOW, { depth: 1 })
      .dots('#fffbe0', [13, 4], [12, 5], [11, 6]),

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

  солнце: (p) =>
    p
      .fill(star(12, 12, 11.6, 7.4, 8, -90), SUN_RAYS, { depth: 1 })
      .fill(circle(12, 12, 7.2), YELLOW)
      .dots('#fffbe0', [8, 7], [7, 8], [9, 7])
      .stamp2(9, 10, ['k', 'k'])
      .dots2(BLUSH, [7, 13])
      .dots2(INK, [10, 14], [11, 15]),

  облако: (p) =>
    p
      .fill(or(circle(6.5, 14.5, 4.4), circle(12, 10, 5.8), circle(17.5, 13, 4.6), box(2.5, 14, 21.5, 19.5, 3)), CLOUD)
      .fill(
        and(circle(12, 10, 4.6), (x, y) => y > 12 && x > 9),
        '#dfe7f4',
        { line: false, depth: 0 },
      )
      .fill(
        and(circle(17.5, 13, 3.4), (_x, y) => y > 14.5),
        '#dfe7f4',
        { line: false, depth: 0 },
      )
      .dots('#ffffff', [9, 7], [10, 6], [8, 8], [4, 13]),

  туча: (p) =>
    p
      .fill(poly([12.5, 11], [7.5, 18], [11.5, 18], [9.5, 23], [17, 15], [13, 15], [16, 11]), YELLOW, { depth: 1 })
      .fill(or(circle(6.5, 9.5, 4.2), circle(12, 6, 5.2), circle(17.5, 8.5, 4.4), box(2.5, 9, 21.5, 13.5, 3)), STORM)
      .dots('#c9cfdc', [9, 3], [10, 2], [8, 4])
      .fill(or(stroke(1.2, [5, 17], [4, 20]), stroke(1.2, [19.5, 17], [18.5, 20])), '#5fb6f5', { depth: 0 }),

  капля: (p) =>
    p
      .fill(or(circle(12, 14.8, 7), poly([12, 1], [18.2, 12], [5.8, 12])), WATER)
      .dots('#ffffff', [8, 12], [8, 13], [8, 14], [9, 11]),

  снежинка: (p) =>
    p.fill(
      or(
        ...[0, 60, 120].map((a) => {
          const r = (a * Math.PI) / 180
          return stroke(
            1.8,
            [12 - 10 * Math.cos(r), 12 - 10 * Math.sin(r)],
            [12 + 10 * Math.cos(r), 12 + 10 * Math.sin(r)],
          )
        }),
        ...[30, 90, 150, 210, 270, 330].map((a) => {
          const r = (a * Math.PI) / 180
          const [x, y] = [12 + 6.5 * Math.cos(r), 12 + 6.5 * Math.sin(r)]
          return stroke(
            1.4,
            [x + 2.6 * Math.cos(r + 2.4), y + 2.6 * Math.sin(r + 2.4)],
            [x, y],
            [x + 2.6 * Math.cos(r - 2.4), y + 2.6 * Math.sin(r - 2.4)],
          )
        }),
      ),
      ICE,
      { depth: 1 },
    ),

  радуга: (p) =>
    p
      .fill(and(circle(12, 18, 11), not(circle(12, 18, 3.6)), above(18)), '#e5323b')
      .fill(and(circle(12, 18, 9.8), not(circle(12, 18, 3.6)), above(18)), '#ff9a2e', { line: false })
      .fill(and(circle(12, 18, 8.6), not(circle(12, 18, 3.6)), above(18)), '#ffd23f', { line: false })
      .fill(and(circle(12, 18, 7.4), not(circle(12, 18, 3.6)), above(18)), '#5cc44a', { line: false })
      .fill(and(circle(12, 18, 6.2), not(circle(12, 18, 3.6)), above(18)), '#3a8ae0', { line: false })
      .fill(and(circle(12, 18, 5), not(circle(12, 18, 3.6)), above(18)), '#8456d8', { line: false })
      .fill(pair(or(circle(3.5, 18, 2.8), circle(6.5, 19, 2.8), box(1, 18.5, 9, 21.5, 1.5))), CLOUD),

  огонь: (p) =>
    p
      .fill(or(circle(12, 15.5, 7), poly([12, 0.8], [18.6, 13], [5.4, 13]), poly([5.5, 13], [4, 6], [8.5, 10])), FLAME)
      .fill(or(circle(12, 17, 4.6), poly([12, 7], [16.2, 15], [7.8, 15])), '#ffd23f', { line: false, depth: 0 })
      .fill(circle(12, 18.5, 2.4), '#fff6c8', { line: false, depth: 0 }),

  лист: (p) =>
    p
      .fill(
        poly([2.5, 21.5], [3.5, 12], [8, 5.5], [15, 2.5], [21.5, 2], [21, 9], [17.5, 15.5], [11, 20], [5, 21]),
        LEAF,
      )
      .fill(stroke(1, [3, 21], [9, 14], [19, 4.5]), '#22773a', { line: false, depth: 0 })
      .fill(
        or(stroke(0.9, [9, 14], [8.5, 9]), stroke(0.9, [13, 10.5], [16, 13]), stroke(0.9, [15, 8.5], [14, 4.5])),
        '#22773a',
        {
          line: false,
          depth: 0,
        },
      )
      .dots('#c6f5a0', [6, 12], [7, 10], [9, 8]),

  дерево: (p) =>
    p
      .fill(or(box(10, 13, 14, 22.5, 1), poly([8, 22.5], [16, 22.5], [14, 20], [10, 20])), BARK)
      .dots('#4e2a10', [11, 16], [12, 18], [11, 20])
      .fill(or(circle(12, 7.5, 6), circle(6.5, 11, 4.6), circle(17.5, 11, 4.6), circle(12, 12, 4.6)), LEAF)
      .dots('#c6f5a0', [9, 3], [8, 4], [3, 9], [4, 8])
      .dots('#22773a', [14, 9], [15, 10], [9, 11], [18, 13]),

  цветок: (p) =>
    p
      .fill(stroke(1.6, [12, 14], [12, 21.6]), LEAF, { depth: 0 })
      .fill(poly([12, 20], [17.5, 15], [19, 17.5]), LEAF, { depth: 1 })
      .fill(
        or(
          ...[0, 72, 144, 216, 288].map((a) =>
            circle(12 + 5 * Math.sin((a * Math.PI) / 180), 9.6 - 5 * Math.cos((a * Math.PI) / 180), 3.6),
          ),
        ),
        PETAL,
      )
      .fill(circle(12, 9.6, 2.6), YELLOW)
      .dots('#fffbe0', [11, 8]),

  кактус: (p) =>
    p
      .fill(
        or(
          box(8.5, 2, 15.5, 17, 3.5),
          box(3.5, 6.5, 6.5, 12.5, 1.5),
          box(3.5, 10, 9, 12.5, 1),
          box(17.5, 4.5, 20.5, 10.5, 1.5),
          box(15, 8, 20.5, 10.5, 1),
        ),
        CACTUS,
      )
      .dots('#ffffff', [10, 5], [13, 8], [10, 11], [13, 13], [5, 8], [19, 6])
      .fill(circle(12, 2, 1.6), '#ff7db1', { depth: 0 })
      .fill(or(poly([5, 17], [19, 17], [17.5, 22.5], [6.5, 22.5]), box(4.5, 16, 19.5, 18)), POT),

  вулкан: (p) =>
    p
      .fill(or(circle(9, 5.6, 3), circle(13, 4.4, 3.2), circle(16.5, 6, 2.6)), SMOKE, { depth: 1 })
      .fill(poly([1, 22.5], [8.5, 9], [15.5, 9], [23, 22.5]), MOUNTAIN)
      .fill(
        or(
          poly([8.5, 9.5], [15.5, 9.5], [14, 13], [12, 12], [10, 15.5], [9.5, 12]),
          stroke(1.6, [14, 12], [16, 16.5], [15.5, 19]),
        ),
        LAVA,
        {
          line: false,
          depth: 0,
        },
      )
      .dots('#ffd23f', [11, 10], [12, 10], [13, 10]),
}
