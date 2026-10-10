import {
  type Art,
  type Paint,
  BLUSH,
  CRATER,
  FIRE,
  GLASS,
  GREY,
  INK,
  METAL,
  RED,
  RING,
  ROCK,
  SATURN,
  SOLAR,
  VIOLET,
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

// Космос.

const OCEAN: Paint = ['#93d4ff', '#2f8fe0', '#1a4f9c']
const LAND: Paint = ['#b6f07a', '#4bbd49', '#24813a']
const SUIT: Paint = ['#ffffff', '#e9eef7', '#a9b3c9']
const VISOR: Paint = ['#5a6fd8', '#2a2f6e', '#141638']
const DISK: Paint = ['#ffd26a', '#ff8a2e', '#c4441a']
const VOID: Paint = ['#4a3a7a', '#120c22', '#05030a']
export const SPACE: Record<string, Art> = {
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

  астероид: (p) =>
    p
      .fill(poly([7, 2.5], [14, 1.6], [20, 5], [22.4, 12], [20, 19.5], [13, 22.4], [6, 21], [1.6, 15], [2, 7.5]), ROCK)
      .fill(circle(14.5, 8, 2.6), CRATER, { line: false, depth: 1 })
      .fill(circle(8, 15, 3), CRATER, { line: false, depth: 1 })
      .fill(circle(16.5, 16, 1.6), CRATER, { line: false, depth: 1 })
      .dots('#e8e0d4', [5, 6], [6, 5], [4, 7]),

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

  земля: (p) =>
    p
      .fill(circle(12, 12, 10.5), OCEAN)
      .fill(
        and(
          circle(12, 12, 9.6),
          or(circle(7, 8, 3.4), circle(9.5, 11, 2.6), circle(15.5, 6, 2.4), circle(16, 15, 3.6), circle(7.5, 17, 1.8)),
        ),
        LAND,
        { line: false, depth: 1 },
      )
      .dots('#ffffff', [5, 5], [6, 4], [4, 6]),

  космонавт: (p) =>
    p
      .fill(box(11.4, 2, 12.6, 4), METAL, { depth: 0 })
      .fill(circle(12, 2.2, 1.1), RED, { depth: 0 })
      .fill(or(circle(12, 11.5, 9.5), box(4, 15, 20, 22.5, 3)), SUIT)
      .fill(ellipse(12, 11, 6.5, 5), VISOR)
      .dots('#ffffff', [8, 8], [9, 7], [10, 7])
      .dots('#8fb1ff', [15, 13], [16, 12])
      .fill(box(8, 18.5, 16, 21), '#3a66e0', { line: false })
      .dots('#ff5b4f', [10, 19], [13, 19]),

  'чёрная дыра': (p) =>
    p
      .fill(and(ellipse(12, 12.5, 11.6, 3.6), not(ellipse(12, 12.5, 8.2, 1.6))), DISK, { depth: 1 })
      .fill(circle(12, 12, 7.4), VOID)
      .fill(and(circle(12, 12, 6.4), not(circle(12, 12, 5.4))), '#6a4fc4', { line: false, depth: 0 })
      .fill(
        and(ellipse(12, 12.5, 11.6, 3.6), not(ellipse(12, 12.5, 7.6, 1.4)), (_x, y) => y > 12.5),
        DISK,
        {
          depth: 1,
        },
      )
      .dots('#c49bff', [8, 7], [9, 6]),
}
