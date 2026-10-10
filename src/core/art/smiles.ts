import { type Art, BEAD, BLUSH, EYE, INK, type Paint, type Px, WHITE, YELLOW, and, circle, ellipse } from '../pixels.ts'

// Смайлы: лица с разным настроением. Цвет лица — само настроение: радость жёлтая, грусть голубая, злость красная,
// страх сиреневый, болезнь зелёная.

const SAD: Paint = ['#c4e4ff', '#6fb0f2', '#3a72c4']
const ANGRY: Paint = ['#ffa391', '#ef4f45', '#ad2431']
const SICK: Paint = ['#dcf7a4', '#9bd24c', '#5a962a']
const SCARED: Paint = ['#ebe3ff', '#b7a5f0', '#7a63c0']
const SLEEPY: Paint = ['#fff4c4', '#f7d36a', '#c99a2a']

/** Рот изнутри и язык. */
const MOUTH = '#7a1f34'
const TONGUE = '#ff7a96'

/** Лицо: круг с бликом сверху слева. */
function face(p: Px, paint: Paint = YELLOW) {
  const shine = typeof paint === 'string' ? WHITE : paint[0]
  return p.fill(circle(12, 12.5, 10.5), paint).dots(shine, [5, 6], [6, 5], [5, 7], [7, 5], [6, 6])
}

export const SMILES: Record<string, Art> = {
  улыбка: (p) => face(p).stamp2(8, 9, BEAD).dots2(BLUSH, [5, 13], [6, 13]).dots2(INK, [9, 14], [10, 15], [11, 15]),

  // глаза-дуги и рот до ушей с языком
  смех: (p) =>
    face(p)
      .stamp2(6, 8, ['.kk.', 'k..k'])
      .fill(
        and(ellipse(12, 13.5, 6.5, 6), (_x, y) => y > 13.5),
        MOUTH,
        { line: false },
      )
      .stamp(6, 13, ['kkkkkkkkkkkk'])
      .stamp(7, 14, ['wwwwwwwwww'])
      .fill(ellipse(12, 18.6, 3.2, 1.6), TONGUE, { line: false })
      .dots2(BLUSH, [4, 12], [5, 12]),

  // глаза-сердечки
  любовь: (p) =>
    face(p)
      .stamp2(5, 8, ['rr.rr', 'rWrrr', 'rrrrr', '.rrr.', '..r..'], { r: '#f0325a', W: '#ffd0da' })
      .dots2(BLUSH, [4, 14], [5, 14])
      .dots2(INK, [9, 15], [10, 16], [11, 16]),

  // тёмные очки и ухмылка
  круто: (p) =>
    face(p)
      .stamp(4, 8, ['kkkkkkkkkkkkkkkk', '.kkkkkk..kkkkkk.', '.kwwkkk..kwwkkk.', '..kkkk....kkkk..'])
      .dots(INK, [10, 16], [11, 16], [12, 16], [13, 16], [14, 15], [15, 14]),

  // круглые глаза, брови вверх, рот «о»
  удивление: (p) =>
    face(p)
      .stamp2(6, 4, ['.kk.'])
      .stamp2(6, 7, EYE)
      .fill(ellipse(12, 17, 2.6, 3.2), MOUTH)
      .dots(TONGUE, [11, 18], [12, 18]),

  // брови домиком, рот вниз, слеза
  грусть: (p) =>
    face(p, SAD)
      .dots2(INK, [6, 8], [7, 7], [8, 7])
      .stamp2(8, 9, BEAD)
      .dots2(INK, [9, 17], [10, 16], [11, 16])
      .stamp(5, 12, ['.t', 'tt', 'tw', 'tt'], { t: '#2f7fe0' }),

  // брови к носу, стиснутые зубы
  злость: (p) =>
    face(p, ANGRY)
      .dots2(INK, [5, 6], [6, 7], [7, 7], [8, 8], [9, 8], [9, 9])
      .stamp2(7, 9, ['wk', 'kk'])
      .stamp(7, 14, ['kkkkkkkkkk', 'kwkwkwkwkk', 'kkkkkkkkkk']),

  // маленькие зрачки, рот волной, капля пота
  страх: (p) =>
    face(p, SCARED)
      .stamp2(6, 8, ['.ww.', 'wwww', 'wwkw', '.ww.'])
      .stamp(7, 15, ['.kk..kk..k', 'k..kk..kk.'])
      .stamp(18, 3, ['.b.', 'bbb', 'bwb', '.b.'], { b: '#5fb6f5' }),

  // закрытые глаза, рот «о» и «з-з»
  сон: (p) =>
    face(p, SLEEPY)
      .stamp2(6, 11, ['kkkk'])
      .fill(ellipse(12, 16.5, 1.6, 1.8), MOUTH)
      .stamp(17, 0, ['kkkkkk', 'kwwwwk', 'kkkwkk', '.kwkk.', 'kwwwwk', 'kkkkkk']),

  // глаза-спирали и кривой рот
  головокружение: (p) =>
    face(p)
      .stamp2(5, 7, ['kkkkk', 'k...k', 'k.k.k', 'k.kkk', 'k....'])
      .dots(INK, [8, 16], [9, 15], [10, 16], [11, 17], [12, 16], [13, 15], [14, 16], [15, 17]),

  // глаза еле открыты, рот кривой, пот
  болезнь: (p) =>
    face(p, SICK)
      .stamp2(6, 9, ['kkkk', '.kk.'])
      .dots2('#6fa83a', [5, 13], [6, 14], [4, 14])
      .dots(INK, [8, 17], [9, 16], [10, 16], [11, 17], [12, 17], [13, 16], [14, 16], [15, 17])
      .stamp(17, 4, ['.b.', 'bbb', 'bwb', '.b.'], { b: '#5fb6f5' }),
}
