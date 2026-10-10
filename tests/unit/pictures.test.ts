import { describe, expect, it } from 'vitest'
import {
  INK,
  isPicture,
  PICTURE_ALIASES,
  PICTURE_GROUPS,
  PICTURE_NAMES,
  PICTURE_SIZE,
  pictureGrid,
  pictureSvg,
  pictureUrl,
  UNKNOWN_PICTURE,
} from '@/core/pictures.ts'

describe('Рисунки', () => {
  it('126 рисунков в девяти группах, имена не повторяются; «?» — не в окне выбора', () => {
    expect(PICTURE_GROUPS.map((g) => g.title)).toEqual([
      'Смайлы',
      'Животные',
      'Сказка',
      'Еда',
      'Сокровища',
      'Вещи',
      'Природа',
      'Транспорт',
      'Космос',
    ])
    expect(PICTURE_NAMES).toHaveLength(126)
    expect(new Set(PICTURE_NAMES).size).toBe(126)
    for (const name of PICTURE_NAMES) expect(isPicture(name), name).toBe(true)
    expect(isPicture(UNKNOWN_PICTURE)).toBe(false)
    expect(PICTURE_NAMES).not.toContain(UNKNOWN_PICTURE)
  })

  it('каждый рисунок — пиксель-арт 24×24: цвета «#rrggbb», по краю сетки — только контур, контур есть', () => {
    expect(PICTURE_SIZE).toBe(24)
    for (const name of [...PICTURE_NAMES, UNKNOWN_PICTURE]) {
      const g = pictureGrid(name)
      expect(g, name).toHaveLength(24)
      for (const row of g) {
        expect(row, name).toHaveLength(24)
        for (const c of row) if (c !== null) expect(c, name).toMatch(/^#[0-9a-f]{6}$/)
      }
      const filled = g.flat().filter(Boolean)
      expect(filled.length, name).toBeGreaterThan(150)
      expect(filled, name).toContain(INK)
      // с краю не торчит цветная клетка: рисунок не обрезан
      const edge = [...g[0], ...g[23], ...g.map((r) => r[0]), ...g.map((r) => r[23])]
      for (const c of edge) expect(c === null || c === INK || name === 'бомба', `${name}: ${c} с краю`).toBe(true)
    }
  })

  it('каждый рисунок — правильный SVG: теги закрыты, атрибуты не повторяются, градиенты на месте', () => {
    for (const name of [...PICTURE_NAMES, UNKNOWN_PICTURE]) {
      const svg = pictureSvg(name)
      expect(svg, name).toMatch(
        /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24" shape-rendering="crispEdges">/,
      )
      expect(svg, name).not.toMatch(/undefined|NaN|\$\{/)
      const open: string[] = []
      for (const [, close, tag, attrs, self] of svg.matchAll(/<(\/?)([a-zA-Z]+)([^>]*?)(\/?)>/g)) {
        if (close) {
          expect(open.pop(), `${name}: </${tag}>`).toBe(tag)
          continue
        }
        const names = [...attrs.matchAll(/\s([a-zA-Z:-]+)="[^"]*"/g)].map((m) => m[1])
        expect(new Set(names).size, `${name}: <${tag}${attrs}>`).toBe(names.length)
        if (!self) open.push(tag)
      }
      expect(open, name).toEqual([])
      const ids = new Set([...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))
      for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) expect(ids.has(ref), `${name}: #${ref}`).toBe(true)
    }
  })

  it('рисунок как адрес картинки: data:image/svg+xml', () => {
    expect(pictureUrl('ракета')).toBe(`data:image/svg+xml,${encodeURIComponent(pictureSvg('ракета'))}`)
  })

  it('прежние имена рисуются как их замены и в окне выбора не показываются', () => {
    expect(PICTURE_ALIASES).toEqual({ колобок: 'улыбка', мышь: 'летучая мышь' })
    for (const [old, now] of Object.entries(PICTURE_ALIASES)) {
      expect(PICTURE_NAMES).not.toContain(old)
      expect(PICTURE_NAMES).toContain(now)
      expect(isPicture(old)).toBe(true)
      expect(pictureSvg(old)).toBe(pictureSvg(now))
    }
  })

  it('неизвестное имя — знак вопроса', () => {
    expect(pictureGrid('ракто')).toEqual(pictureGrid(UNKNOWN_PICTURE))
    expect(pictureSvg('ракто')).toBe(pictureSvg(UNKNOWN_PICTURE))
    expect(pictureSvg('ракета')).not.toBe(pictureSvg(UNKNOWN_PICTURE))
  })
})
