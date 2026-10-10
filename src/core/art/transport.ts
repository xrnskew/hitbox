import {
  type Art,
  type Paint,
  COAL,
  GLASS,
  METAL,
  RED,
  and,
  box,
  circle,
  ellipse,
  or,
  pair,
  poly,
  stroke,
} from '../pixels.ts'

// Транспорт: всё смотрит вправо.

const WHEEL: Paint = ['#5a5a6c', '#2e2e3c', '#17171f']
const BUS: Paint = ['#fff09a', '#ffcd38', '#e08a17']
const SMOKE_T: Paint = ['#ffffff', '#d9dce6', '#9da2b4']
const TRACTOR: Paint = ['#a8ee78', '#3fae47', '#22773a']
const PLANE: Paint = ['#ffffff', '#e9eef7', '#a9b3c9']
const BALLOON: Paint = ['#ff8a8a', '#e5323b', '#9c1730']
const WOOD_T: Paint = ['#eab06e', '#c98a4b', '#8a4f22']
const SAIL: Paint = ['#ffffff', '#f4f1ea', '#b9b2a2']

export const TRANSPORT: Record<string, Art> = {
  машина: (p) =>
    p
      .fill(poly([5.5, 10.5], [8.5, 5], [16, 5], [19.5, 10.5]), RED)
      .fill(box(1.5, 10, 22.5, 18.5, 2.5), RED)
      .fill(
        or(poly([7.5, 10], [9.5, 6.5], [11.5, 6.5], [11.5, 10]), poly([13, 10], [13, 6.5], [15.5, 6.5], [17.5, 10])),
        GLASS,
        {
          line: false,
          depth: 1,
        },
      )
      .fill(box(20.5, 12, 22.5, 14), '#ffe066', { line: false })
      .fill(pair(circle(6.5, 18.5, 3.2)), WHEEL)
      .fill(pair(circle(6.5, 18.5, 1.2)), '#c9cedd', { line: false })
      .dots('#ffb3a8', [3, 11], [4, 11]),

  автобус: (p) =>
    p
      .fill(box(1, 4, 23, 19, 2.5), BUS)
      .fill(or(box(3, 6.5, 6, 10), box(7.5, 6.5, 10.5, 10), box(12, 6.5, 15, 10), box(16.5, 6.5, 21.5, 10)), GLASS, {
        line: false,
        depth: 1,
      })
      .fill(box(1.5, 13, 22.5, 14.5), '#e08a17', { line: false })
      .fill(pair(circle(6, 19.5, 2.9)), WHEEL)
      .fill(pair(circle(6, 19.5, 1)), '#c9cedd', { line: false })
      .dots('#ffffff', [21, 16], [22, 16]),

  поезд: (p) =>
    p
      .fill(box(4, 3, 7.5, 9), COAL)
      .fill(or(circle(5, 2.8, 1.5), circle(8, 2.4, 1.3)), SMOKE_T, { depth: 0 })
      .fill(box(2, 8, 14.5, 17, 2), ['#ff7d6f', '#e5323b', '#9c1730'])
      .fill(box(13, 3.5, 22.5, 17, 1), ['#6b8cff', '#3a66e0', '#1f3a9a'])
      .fill(box(15.5, 6, 20.5, 10), GLASS, { line: false, depth: 1 })
      .fill(poly([1.4, 18], [2.8, 14.5], [4, 18]), '#ffd23f', { depth: 0 })
      .fill(circle(5.5, 19, 2.4), WHEEL)
      .fill(circle(11, 19, 2.4), WHEEL)
      .fill(circle(18, 18.5, 3.2), WHEEL)
      .dots('#c9cedd', [5, 18], [10, 18], [17, 17]),

  грузовик: (p) =>
    p
      .fill(box(1, 4, 14, 17.5, 1), ['#ffd08a', '#f6832a', '#bf5119'])
      .fill(or(poly([14, 17.5], [14, 7.5], [19, 7.5], [22.5, 12], [22.5, 17.5])), ['#93bbff', '#3a66e0', '#1f3a9a'])
      .fill(poly([15.5, 9], [18.5, 9], [21, 12], [15.5, 12]), GLASS, { line: false, depth: 1 })
      .dots('#bf5119', [4, 7], [4, 10], [4, 13], [8, 7], [8, 10], [8, 13], [11, 7], [11, 10], [11, 13])
      .fill(or(circle(5, 18.5, 2.9), circle(18, 18.5, 2.9)), WHEEL)
      .dots('#c9cedd', [5, 18], [18, 18]),

  трактор: (p) =>
    p
      .fill(box(16.5, 3.5, 18, 9), COAL, { depth: 0 })
      .fill(box(10, 8.5, 21.5, 15.5, 1.5), TRACTOR)
      .fill(box(2.5, 2, 11.5, 13.5, 1), TRACTOR)
      .fill(box(4.5, 4, 9.5, 8.5), GLASS, { line: false, depth: 1 })
      .fill(circle(7, 17.5, 5.2), WHEEL)
      .fill(circle(7, 17.5, 2), '#ffd23f', { line: false, depth: 0 })
      .fill(circle(18.5, 19.5, 3.2), WHEEL)
      .fill(circle(18.5, 19.5, 1.1), '#ffd23f', { line: false, depth: 0 }),

  самолёт: (p) =>
    p
      .fill(poly([2.5, 11.5], [1.5, 3.5], [4.5, 3.5], [8.5, 10]), ['#ff7d6f', '#e5323b', '#9c1730'])
      .fill(or(ellipse(12.5, 12, 10.2, 3.4), box(2, 9.5, 12, 14.5, 2)), PLANE)
      .dots('#3db6ea', [8, 11], [10, 11], [12, 11], [14, 11])
      .fill(poly([18.5, 9.5], [21, 10.8], [21.5, 12], [18.5, 12]), GLASS, { line: false })
      .fill(poly([9.5, 13], [15, 13], [9.5, 20.5], [6.5, 20.5]), METAL)
      .fill(box(1, 15, 6, 16.3), METAL, { depth: 0 }),

  вертолёт: (p) =>
    p
      .fill(box(2, 3, 22, 4.2), COAL, { depth: 0 })
      .fill(box(11.4, 4, 12.6, 7), COAL, { depth: 0 })
      .fill(or(box(2, 10, 9, 12), circle(2.6, 9.5, 1.6)), ['#ffd08a', '#ffb12e', '#c47a0f'])
      .fill(ellipse(14, 12.5, 8, 5.6), ['#ffe27a', '#ffc632', '#d4851a'])
      .fill(
        and(ellipse(14, 12.5, 7, 4.6), (x, y) => x > 14 && y < 13),
        GLASS,
        { line: false, depth: 1 },
      )
      .fill(or(box(8, 20, 21, 21.2), box(10.5, 17.5, 11.5, 20.5), box(17, 17.5, 18, 20.5)), COAL, { depth: 0 }),

  'воздушный шар': (p) =>
    p
      .fill(box(9, 18.5, 15, 22.5, 1), ['#e8b98a', '#b07a48', '#6e4422'])
      .fill(pair(stroke(0.9, [6.5, 14], [9.5, 18.5])), '#8a6a4a', { line: false, depth: 0 })
      .fill(or(circle(12, 9, 8.6), poly([5, 13], [19, 13], [14, 17.5], [10, 17.5])), BALLOON)
      .fill(
        and(circle(12, 9, 8.6), (x) => x > 10 && x < 14),
        '#ffd23f',
        { line: false, depth: 0 },
      )
      .fill(
        and(circle(12, 9, 8.6), (x) => x < 6),
        '#ffd23f',
        { line: false, depth: 0 },
      )
      .fill(
        and(circle(12, 9, 8.6), (x) => x > 18),
        '#ffd23f',
        { line: false, depth: 0 },
      )
      .dots('#ffffff', [7, 3], [6, 4], [5, 5]),

  лодка: (p) =>
    p
      .fill(box(11.3, 1.5, 12.7, 16), WOOD_T, { depth: 0 })
      .fill(poly([13, 2], [21, 14.5], [13, 14.5]), SAIL)
      .fill(poly([10.5, 4], [10.5, 14.5], [4, 14.5]), SAIL)
      .fill(poly([1.5, 15], [22.5, 15], [19, 21.5], [5, 21.5]), WOOD_T)
      .fill(box(3, 15.5, 21, 17), '#ffffff', { line: false }),

  корабль: (p) =>
    p
      .fill(box(13, 3, 16, 9), ['#ff7d6f', '#e5323b', '#9c1730'])
      .fill(box(13, 3, 16, 4.5), COAL, { line: false })
      .fill(box(6, 8, 19, 13.5, 1), PLANE)
      .dots('#3db6ea', [8, 10], [10, 10], [12, 10], [14, 10], [16, 10])
      .fill(poly([1, 13], [23, 13], [20, 21.5], [4, 21.5]), ['#6b8cff', '#2d377c', '#171c48'])
      .fill(box(1.5, 13.5, 22.5, 15.5), '#e5323b', { line: false })
      .dots('#ffffff', [5, 17], [10, 17], [15, 17]),
}
