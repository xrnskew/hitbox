import {
  type Art,
  type Paint,
  type Pt,
  GEM,
  GOLD,
  INK,
  RED,
  ROSE,
  WHITE,
  WOOD,
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
} from '../pixels.ts'

// Сокровища и бонусы: что ловят и собирают.

const RUBY: Paint = ['#ff8a96', '#e5223f', '#9c1030']
const SAPPHIRE: Paint = ['#a8d0ff', '#3a7ae0', '#1f449a']
const AMETHYST: Paint = ['#f0c4ff', '#b05ce6', '#6a2a9c']
const CORK: Paint = ['#e8b98a', '#b07a48', '#6e4422']
const GLASS_POTION: Paint = ['#ffffff', '#d8f2fb', '#8cc2d8']
const POTION: Paint = ['#c6ff9a', '#5fd65a', '#2b8f3a']
export const TREASURE: Record<string, Art> = {
  монетка: (p) =>
    p
      .fill(circle(12, 12, 10.5), GOLD)
      .fill(and(circle(12, 12, 7.8), not(circle(12, 12, 6.7))), '#d4851a', { line: false })
      .fill(star(12, 12.4, 5, 2.2), '#e8961c', { line: false })
      .dots('#fffbe0', [5, 6], [6, 5], [5, 7], [7, 4]),

  звезда: (p) =>
    p
      .fill(star(12, 13, 11, 5.2), YELLOW)
      .dots('#fffbe0', [10, 5], [10, 6], [11, 4])
      .stamp2(9, 11, ['k', 'k'])
      .dots2(INK, [10, 14], [11, 15]),

  сердце: (p) =>
    p
      .fill(or(pair(circle(7.4, 8.4, 5.6)), poly([2.1, 10], [21.9, 10], [12, 21.6])), ROSE)
      .dots('#ffe0e6', [5, 5], [4, 6], [6, 5], [4, 7]),

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

  подарок: (p) =>
    p
      .fill(pair(poly([12, 7], [6.5, 1.6], [4.2, 4.5], [7.5, 7])), GOLD, { depth: 1 })
      .fill(box(3, 10, 21, 22.2), RED)
      .fill(box(1.6, 6.5, 22.4, 10.5), RED)
      .fill(box(10.4, 6.5, 13.6, 22.2), GOLD, { line: false, body: box(1.6, 6.5, 22.4, 22.2) })
      .dots(INK, [10, 10], [11, 10], [12, 10], [13, 10]),

  корона: (p) =>
    p
      .fill(poly([2, 8], [7, 13], [12, 4], [17, 13], [22, 8], [20.5, 19], [3.5, 19]), GOLD)
      .fill(box(3, 17, 21, 21, 1), GOLD)
      .fill(pair(circle(2.5, 7, 1.7)), GOLD, { depth: 1 })
      .fill(circle(12, 3.4, 1.8), GOLD, { depth: 1 })
      .fill(circle(12, 15, 2), RUBY, { depth: 1 })
      .fill(pair(circle(7, 16.5, 1.3)), SAPPHIRE, { line: false, depth: 1 })
      .dots('#fffbe0', [5, 10], [4, 11], [11, 7]),

  кольцо: (p) =>
    p
      .fill(and(circle(12, 15, 7.6), not(circle(12, 15, 4.6))), GOLD)
      .fill(poly([12, 2], [16, 5.5], [12, 10], [8, 5.5]), AMETHYST, { depth: 1 })
      .dots('#ffffff', [11, 4], [10, 5])
      .dots('#fffbe0', [6, 12], [7, 11], [6, 13]),

  сундук: (p) =>
    p
      .fill(and(ellipse(12, 11, 10.5, 7), above(11)), WOOD)
      .fill(box(1.5, 10, 22.5, 21.5, 1), WOOD)
      .fill(box(1.5, 9.5, 22.5, 11.5), GOLD, { depth: 1 })
      .fill(or(box(4.5, 4.5, 6.5, 21.5), box(17.5, 4.5, 19.5, 21.5)), GOLD, { line: false, depth: 1 })
      .fill(box(9.5, 9, 14.5, 15, 1), GOLD)
      .stamp(11, 11, ['kk', 'kk', '.k'], { '.': INK })
      .dots('#ffe1aa', [3, 6], [4, 5]),

  кубок: (p) =>
    p
      .fill(pair(and(circle(4.5, 7.5, 3.6), not(circle(4.5, 7.5, 1.8)))), GOLD)
      .fill(poly([4, 2], [20, 2], [19, 8], [15, 13.5], [9, 13.5], [5, 8]), GOLD)
      .fill(box(10.5, 13, 13.5, 17.5), GOLD)
      .fill(box(6, 17.5, 18, 22, 1), ['#c98a4b', '#8a4f22', '#5a2f12'])
      .fill(box(9, 18.5, 15, 20), '#ffd23f', { line: false })
      .fill(star(12, 7.2, 3.6, 1.6), '#fff4b0', { line: false })
      .dots('#fffbe0', [6, 3], [6, 4], [7, 5]),

  медаль: (p) =>
    p
      .fill(poly([4, 0.8], [9, 0.8], [13.5, 10], [10, 11]), ['#7fb2ff', '#3a66e0', '#1f3a9a'], { depth: 1 })
      .fill(poly([20, 0.8], [15, 0.8], [10.5, 10], [14, 11]), ['#ff8a8a', '#e5323b', '#9c1730'], { depth: 1 })
      .fill(circle(12, 15.5, 7), GOLD)
      .fill(and(circle(12, 15.5, 5.4), not(circle(12, 15.5, 4.4))), '#d4851a', { line: false })
      .fill(star(12, 15.8, 3.4, 1.5), '#fff4b0', { line: false })
      .dots('#fffbe0', [8, 11], [7, 12]),

  зелье: (p) =>
    p
      .fill(box(9.5, 0.8, 14.5, 4.5, 1), CORK)
      .fill(box(10, 4, 14, 9), GLASS_POTION, { depth: 1 })
      .fill(circle(12, 15, 7.8), GLASS_POTION)
      .fill(
        and(circle(12, 15, 6.8), (_x, y) => y > 13 + 0.6 * Math.sin(_x)),
        POTION,
        { line: false },
      )
      .fill(circle(10, 17, 1.2), '#c6ffb0', { line: false, depth: 0 })
      .fill(circle(14.5, 19, 0.9), '#c6ffb0', { line: false, depth: 0 })
      .dots('#ffffff', [7, 11], [6, 12], [6, 13]),
}
