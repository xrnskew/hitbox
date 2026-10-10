import { describe, expect, it } from 'vitest'
import { PICTURE_NAMES, pictureUrl, UNKNOWN_PICTURE } from '@/core/pictures.ts'
import { picturesFor, runner } from '@/sandbox/harness.ts'

describe('Рисунки в игре', () => {
  it('в игру уходят только рисунки, названные в коде, и «?»', () => {
    const data = JSON.parse(picturesFor(['var playerPic = "кот";', 'drawPic("яблоко", x, y);']))
    expect(Object.keys(data.urls).sort()).toEqual(['?', 'кот', 'яблоко'].sort())
    expect(data.urls['кот']).toBe(pictureUrl('кот'))
    expect(data.unknown).toBe(UNKNOWN_PICTURE)
  })

  it('прежнее имя из старого сохранения — картинка его замены', () => {
    const data = JSON.parse(picturesFor(['var playerPic = "колобок";']))
    expect(data.urls['колобок']).toBe(pictureUrl('улыбка'))
  })

  it('данные — одна строка: номера строк обвязки не зависят от того, сколько рисунков в коде', () => {
    const one = runner.buildDoc(['var mark1 = "кот";'], { focus: true, hitboxes: false, game: 'catch' })
    const all = runner.buildDoc(['var mark2 = ' + PICTURE_NAMES.map((n) => `"${n}"`).join(' + ')], {
      focus: true,
      hitboxes: false,
      game: 'catch',
    })
    const line = (doc: string, code: string) => doc.split('\n').findIndex((l) => l.includes(code))
    expect(line(one, 'var mark1')).toBe(runner.headerLines)
    expect(line(all, 'var mark2')).toBe(runner.headerLines)
    expect(one).not.toContain('__TB_PICTURES__')
  })
})
