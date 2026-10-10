import {
  type Art,
  type Paint,
  BEAD,
  BLUSH,
  EYE,
  GHOST,
  GOLD,
  GREEN,
  GREY,
  INK,
  LEAF,
  METAL,
  RED,
  SNOW,
  WHITE,
  above,
  and,
  box,
  circle,
  ellipse,
  or,
  pair,
  poly,
  stroke,
} from '../pixels.ts'

// Сказка: чудища и волшебные существа.

const BONE: Paint = ['#ffffff', '#ede7d6', '#aea48c']
const WITCH: Paint = ['#a47cf0', '#5b3aa6', '#2f1d63']
const SLIME: Paint = ['#c9ff9e', '#5fd65a', '#2b8f3a']
const GOBLIN: Paint = ['#c6f08a', '#7cb83a', '#4a8424']
const DEVIL: Paint = ['#ff9a8a', '#e8413e', '#a31f2c']
const HORN: Paint = ['#fff1dc', '#e2cfb0', '#a9926c']
const CAPE: Paint = ['#ff6f7d', '#c4243a', '#7a1024']
const PUMPKIN: Paint = ['#ffb35c', '#f57f1f', '#b8510f']
const GLOW = '#ffe066'
export const FAIRY: Record<string, Art> = {
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

  единорог: (p) =>
    p
      .fill(pair(poly([5, 9], [5.5, 3], [9.5, 6.5])), SNOW)
      .fill(ellipse(12, 13.5, 8.6, 7.6), SNOW)
      .fill(or(stroke(2.6, [6, 6.5], [3, 9], [2.2, 14]), stroke(2.4, [8, 5.5], [4.6, 7])), '#ff7db1', { depth: 1 })
      .fill(stroke(2.2, [9.5, 6], [5.5, 10.5], [4.8, 15.5]), '#9b6cf0', { line: false, depth: 1 })
      .fill(stroke(1.6, [10.5, 7.2], [7.5, 11], [7, 13.5]), '#5ccdf2', { line: false, depth: 1 })
      .fill(poly([12, 0.6], [14.6, 9], [9.4, 9]), GOLD, { depth: 1 })
      .dots('#d4851a', [11, 7], [12, 5], [13, 7], [12, 3])
      .fill(ellipse(13, 18.3, 5.6, 3.4), ['#ffe3ef', '#ffc6dc', '#e895b8'], { line: false, depth: 1 })
      .stamp2(9, 11, BEAD)
      .dots(INK, [11, 18], [15, 18])
      .dots2(BLUSH, [6, 15], [7, 15]),

  череп: (p) =>
    p
      .fill(or(circle(12, 10, 9.5), box(6.5, 13, 17.5, 21.5, 2.5)), BONE)
      .fill(pair(ellipse(8, 10.5, 2.6, 3)), INK, { line: false })
      .dots2('#ff4b5c', [8, 10])
      .fill(poly([12, 14], [10.6, 16.6], [13.4, 16.6]), INK, { line: false })
      .dots(INK, [9, 19], [9, 20], [11, 19], [11, 20], [13, 19], [13, 20], [15, 19], [15, 20])
      .dots('#ffffff', [6, 4], [5, 5], [7, 3]),

  ведьма: (p) =>
    p
      .fill(circle(12, 15, 7.2), ['#d6f5a4', '#9fd65a', '#5f9a2a'])
      .fill(pair(stroke(2.2, [5.5, 12], [4.5, 20])), '#5a3d7a', { depth: 1 })
      .stamp2(8, 14, BEAD)
      .dots2(INK, [10, 19], [11, 19])
      .fill(ellipse(12, 10, 11.2, 2.4), WITCH)
      .fill(poly([6.5, 9.5], [9, 3], [14, 0.8], [13, 4], [17.5, 9.5]), WITCH)
      .fill(box(7.5, 7.5, 16.5, 9, 0), '#ffc632', { line: false })
      .dots('#fff09c', [11, 8])
      .dots('#c49bff', [10, 4], [9, 5]),

  рыцарь: (p) =>
    p
      .fill(poly([12, 3.5], [15, 0.8], [19.5, 1.5], [16.5, 4.5]), RED, { depth: 1 })
      .fill(or(and(circle(12, 11, 9), above(11)), box(3, 10, 21, 21.5, 3)), METAL)
      .fill(box(5, 10.5, 19, 13.5, 1), INK)
      .fill(box(11.3, 13.5, 12.7, 20), '#7f86a0', { line: false })
      .dots(INK, [7, 16], [7, 18], [9, 17], [9, 19], [15, 16], [15, 18], [17, 17], [17, 19])
      .dots('#ffffff', [6, 5], [7, 4], [5, 6])
      .dots('#5ccdf2', [8, 12], [9, 12], [15, 12], [16, 12]),

  слизь: (p) =>
    p
      .fill(or(ellipse(12, 16, 10.6, 6.6), ellipse(12, 10.5, 6.5, 6.5), circle(12, 4.5, 2)), SLIME)
      .dots('#eaffd8', [8, 6], [9, 5], [7, 7], [5, 12], [6, 11])
      .stamp2(8, 12, BEAD)
      .dots2(INK, [10, 17], [11, 17])
      .dots(INK, [11, 18], [12, 18])
      .dots2('#2c8f3a', [3, 20], [4, 21]),

  гоблин: (p) =>
    p
      .fill(pair(poly([5, 9.5], [0.6, 6.5], [4, 14])), GOBLIN)
      .fill(ellipse(12, 13, 8.5, 9), GOBLIN)
      .dots2('#4f8a2a', [6, 8], [7, 8], [8, 9])
      .stamp2(7, 10, ['yy', 'yk'], { y: '#ffe066' })
      .fill(poly([10.5, 13], [13.5, 13], [12, 16]), ['#b6e070', '#7cb83a', '#4f8a2a'], { line: false, depth: 1 })
      .stamp(8, 17, ['kkkkkkkk', 'kw.ww.wk', '.kkkkkk.'], { '.': INK }),

  демон: (p) =>
    p
      .fill(pair(poly([4, 8], [2.5, 1], [9, 5])), HORN, { depth: 1 })
      .fill(circle(12, 13, 9.5), DEVIL)
      .dots2(INK, [6, 8], [7, 9], [8, 9])
      .stamp2(7, 10, ['yk', 'kk'], { y: '#ffe066' })
      .dots(INK, [7, 15], [8, 16], [9, 17], [10, 17], [11, 17], [12, 17], [13, 17], [14, 17], [15, 16], [16, 15])
      .dots(WHITE, [9, 18], [14, 18])
      .dots('#ffb3a8', [6, 5], [5, 6]),

  вампир: (p) =>
    p
      .fill(pair(poly([2, 22.5], [2, 15], [8, 18])), CAPE, { depth: 1 })
      .fill(circle(12, 12.5, 8.8), ['#ffffff', '#eae6f2', '#b3abc9'])
      .fill(
        and(circle(12, 12.5, 8.8), (x, y) => y < 6.5 + Math.abs(x - 12) * 0.35 && !(Math.abs(x - 12) < 1 && y > 5)),
        '#2a2238',
        { line: false },
      )
      .stamp2(8, 10, ['rk', 'kk'], { r: '#ff3b4f' })
      .dots(INK, [10, 15], [11, 15], [12, 15], [13, 15])
      .dots(WHITE, [10, 16], [13, 16]),

  тыква: (p) =>
    p
      .fill(stroke(2, [12, 5.5], [13, 2], [15.5, 2]), '#3f8f3a')
      .fill(or(ellipse(7.5, 13.5, 6, 8.5), ellipse(16.5, 13.5, 6, 8.5), ellipse(12, 13.5, 6, 9)), PUMPKIN)
      .dots('#d0661a', [9, 8], [9, 12], [9, 16], [14, 8], [14, 12], [14, 16])
      .fill(pair(poly([6, 12.5], [10, 12.5], [8, 9.5])), GLOW, { line: false })
      .fill(poly([6, 15.5], [18, 15.5], [16.5, 19], [14.5, 17.5], [12, 19.5], [9.5, 17.5], [7.5, 19]), GLOW, {
        line: false,
      }),
}
