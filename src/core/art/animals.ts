import {
  type Art,
  type Paint,
  BEAD,
  BLUE,
  BLUE_WING,
  BLUSH,
  BROWN,
  CREAM,
  EYE,
  FOX,
  GREEN,
  INK,
  NAVY,
  ORANGE,
  OWL,
  PINK,
  PUPIL,
  PURPLE,
  RED,
  SKY,
  SNOW,
  SOOT,
  TAN,
  WHITE,
  WING,
  YELLOW,
  and,
  box,
  circle,
  ellipse,
  or,
  pair,
  poly,
  stroke,
} from '../pixels.ts'

// Животные.

const WOLF: Paint = ['#c8cede', '#8b93ab', '#545b74']
const SNAKE: Paint = ['#b6ee6c', '#56b84a', '#2b7a3a']
export const ANIMALS: Record<string, Art> = {
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

  лиса: (p) =>
    p
      .fill(pair(poly([2.2, 1.2], [11, 8.5], [2.8, 12])), FOX)
      .fill(pair(poly([3.8, 4.2], [8.6, 8.3], [4.2, 9.8])), '#5e3720', { line: false })
      .fill(poly([1.5, 11.5], [5, 8], [12, 7.3], [19, 8], [22.5, 11.5], [21, 15.5], [12, 22.6], [3, 15.5]), FOX)
      .fill(pair(poly([1.8, 12.5], [9, 15], [12, 22.6], [4, 16.5])), CREAM, { line: false })
      .stamp2(7, 11, BEAD)
      .stamp2(11, 19, ['w', 'k']),

  волк: (p) =>
    p
      .fill(pair(poly([2.5, 0.8], [10, 7.5], [3, 11])), WOLF)
      .fill(pair(poly([4, 4], [7.8, 7.6], [4.3, 9.3])), '#3d4258', { line: false })
      .fill(
        poly(
          [1, 12],
          [4.5, 8],
          [12, 7],
          [19.5, 8],
          [23, 12],
          [21, 14],
          [22.4, 16],
          [19, 17],
          [12, 22.8],
          [5, 17],
          [1.6, 16],
          [3, 14],
        ),
        WOLF,
      )
      .fill(poly([7, 15], [12, 13.5], [17, 15], [15, 20], [12, 22.6], [9, 20]), '#e6e9f0', { line: false })
      .dots2('#3d4258', [7, 9], [8, 9], [9, 10])
      .stamp2(7, 11, ['yk', 'kk'], { y: '#ffd23f' })
      .stamp(10, 16, ['kkkk', '.kk.'])
      .dots(WHITE, [10, 16])
      .dots2(INK, [10, 19], [11, 20]),

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

  лягушка: (p) =>
    p
      .fill(or(pair(circle(6.5, 6.5, 4.5)), ellipse(12, 15, 10.5, 7.5)), GREEN)
      .fill(ellipse(12, 18.2, 6.5, 3.2), '#d8f5ac', { line: false })
      .stamp2(5, 4, EYE)
      .dots2(BLUSH, [4, 14], [5, 14])
      .dots2(INK, [6, 15], [7, 16], [8, 16], [9, 16], [10, 16], [11, 16]),

  пингвин: (p) =>
    p
      .fill(pair(poly([4.5, 10.5], [1, 17], [3, 19.5], [5.5, 14])), NAVY)
      .fill(ellipse(12, 12, 8.5, 10), NAVY)
      .fill(ellipse(12, 14.6, 5.8, 7.2), CREAM, { line: false })
      .stamp2(8, 9, BEAD)
      .fill(poly([9.6, 13], [14.4, 13], [12, 16]), '#ffb12e')
      .dots2(BLUSH, [7, 14])
      .fill(pair(ellipse(8.5, 22, 2.6, 1.3)), '#ff9a2e'),

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

  птичка: (p) =>
    p
      .fill(poly([4.5, 11], [0.8, 7.5], [1.5, 13], [0.8, 17.5], [4.5, 15]), '#2f55c4')
      .fill(pair(ellipse(8.5, 22, 2.3, 1.2)), '#ffb12e')
      .fill(ellipse(12, 13, 9, 8.6), BLUE)
      .fill(ellipse(13.5, 17.2, 5.2, 3), '#e9f1ff', { line: false })
      .fill(poly([20, 10.5], [23.4, 12.5], [20, 14.5]), '#ffb12e')
      .fill(ellipse(7.6, 14, 4.6, 3), BLUE_WING, { depth: 1 })
      .stamp(15, 7, EYE),

  цыплёнок: (p) =>
    p
      .fill(poly([9, 5.5], [8.6, 1.5], [10.8, 3.4], [12.6, 1], [13.6, 5.5]), YELLOW)
      .fill(pair(ellipse(8, 22, 2.4, 1.2)), '#ff9a2e')
      .fill(ellipse(11, 13, 9.5, 9), YELLOW)
      .fill(poly([19.5, 10.5], [23.2, 12.6], [19.5, 14.8]), '#ff9a2e')
      .fill(ellipse(6.8, 14.2, 4.3, 3), ['#ffe27a', '#ffbe2a', '#e08a12'], { depth: 1 })
      .stamp(15, 9, BEAD)
      .dots(BLUSH, [16, 13], [17, 13]),

  'летучая мышь': (p) =>
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

  рыба: (p) =>
    p
      .fill(poly([6, 7.5], [8.5, 3], [13.5, 4], [14, 7.5]), '#2f8fd8')
      .fill(poly([15.5, 12.5], [22.5, 5.5], [21, 12.5], [22.5, 19.5]), '#2f8fd8')
      .fill(ellipse(10, 12.5, 8.8, 6.3), SKY)
      .dots('#2585cf', [11, 8], [10, 9], [10, 10], [10, 11], [10, 12], [10, 13], [10, 14], [10, 15], [11, 16])
      .stamp(4, 10, PUPIL)
      .dots(INK, [2, 14], [3, 14]),

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

  паук: (p) =>
    p
      .fill(box(11.5, 1, 12.5, 5), '#c9c4d8', { line: false })
      .fill(
        pair(
          or(
            stroke(1.4, [7, 10.5], [3.5, 6.5], [2.4, 8.5]),
            stroke(1.4, [6.5, 13], [2.5, 11.5], [2.2, 14.5]),
            stroke(1.4, [7, 15.5], [3.5, 17], [2.6, 20.5]),
            stroke(1.4, [8.5, 17.5], [6.5, 20.5], [5.8, 22]),
          ),
        ),
        SOOT,
        { depth: 1 },
      )
      .fill(circle(12, 13.5, 7.4), ['#a58fd6', '#6a54a3', '#3b2d66'])
      .stamp2(7, 10, ['.ww.', 'wwkw', 'wwkk', '.ww.'])
      .dots('#c9b8f0', [7, 8], [8, 7], [6, 9])
      .dots2(INK, [10, 16], [11, 17])
      .dots2(WHITE, [10, 17]),

  змея: (p) =>
    p
      .fill(
        stroke(4.6, [3, 20.5], [12, 20.5], [18, 19], [19, 15.5], [15, 13.5], [8, 13], [5.5, 10.5], [7, 7.5], [11, 6.5]),
        SNAKE,
        { depth: 1 },
      )
      .dots('#ffe066', [6, 20], [10, 21], [15, 20], [18, 17], [14, 14], [9, 13], [6, 11])
      .fill(stroke(1, [17, 8.5], [21, 9.5], [22.5, 8.5]), '#ff3b5c', { line: false })
      .fill(ellipse(14.5, 6.5, 5, 4), SNAKE)
      .stamp(13, 4, ['wk', 'kk'])
      .dots(INK, [17, 7], [18, 7])
      .dots('#d6ff9a', [12, 4], [11, 5]),
}
