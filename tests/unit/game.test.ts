import { describe, expect, it } from 'vitest'
import {
  BOMB_APPLES,
  BOMB_CATCH,
  BOMB_LINE,
  FINISHED_CODES,
  GOLD_APPLES,
  GOLD_CATCH,
  GOLD_LINE,
  STEP_APPLES,
  STEP_CATCH,
  STEP_HERO,
  TUTORIAL_CODES,
  TUTORIAL_ENGINE,
} from '@/lessons/catch/tabs.ts'
import { withSetting } from './build.ts'
import { boot } from './sim.ts'

describe('учебная версия', () => {
  it('движок без шагов запускается и рисует счёт и жизни', () => {
    const sim = boot(TUTORIAL_CODES)
    sim.tick()
    expect(sim.drawn).toEqual(['Счёт: 0', 'Жизни: 3'])
    expect(TUTORIAL_ENGINE).not.toMatch(/bombPic|goldPic|playerPic/)
    expect(sim.peek('playerSpeed')).toBe(0)
    expect(sim.peek('fallSpeed')).toBe(0)
  })

  it('шаг 1: герой ездит и не уезжает за край', () => {
    const engine = TUTORIAL_ENGINE.replace('var playerSpeed = 0;', 'var playerSpeed = 3;')
    const sim = boot([engine, STEP_HERO, TUTORIAL_CODES[2], TUTORIAL_CODES[3]])
    sim.key('ArrowRight', true)
    sim.tick(2)
    expect(sim.peek('playerX')).toBe(170 + 3 * 2)
    sim.tick(100)
    expect(sim.peek('playerX')).toBe(340)
    sim.key('ArrowRight', false)
    sim.key('ArrowLeft', true)
    sim.tick(150)
    expect(sim.peek('playerX')).toBe(0)
  })

  it('шаги 2 и 3: яблоки падают, ловятся и роняются, игра кончается', () => {
    const engine = TUTORIAL_ENGINE.replace('var playerSpeed = 0;', 'var playerSpeed = 3;').replace(
      'var fallSpeed   = 0;',
      'var fallSpeed   = 3;',
    )
    const sim = boot([engine, STEP_HERO, STEP_APPLES, STEP_CATCH])
    sim.tick(60)
    expect(sim.peek<unknown[]>('items').length).toBe(1)

    sim.peek('items = [{ x: playerX, y: playerY - 10 }]')
    sim.tick()
    expect(sim.peek('score')).toBe(1)

    sim.peek('items = [{ x: 0, y: 499 }]; playerX = 300')
    sim.tick()
    expect(sim.peek('lives')).toBe(2)

    sim.peek('lives = 1; items = [{ x: 0, y: 499 }]')
    sim.tick()
    expect(sim.peek('lives')).toBe(0)
    sim.tick()
    expect(sim.drawn).toContain('Игра окончена')
    // логика остановлена: корзина не едет
    sim.key('ArrowLeft', true)
    sim.tick(5)
    expect(sim.peek('playerX')).toBe(300)
  })
})

describe('бомба и звезда', () => {
  it('бомба: поймал — минус жизнь, упустил — не страшно', () => {
    const engine = withSetting(TUTORIAL_ENGINE, 'bombPic', BOMB_LINE)
    const sim = boot([engine, STEP_HERO, BOMB_APPLES, BOMB_CATCH])
    sim.peek('items = [{ x: playerX, y: playerY, kind: "bomb" }]')
    sim.tick()
    expect(sim.peek('lives')).toBe(2)

    sim.peek('items = [{ x: 0, y: 499, kind: "bomb" }]; playerX = 300')
    sim.tick()
    expect(sim.peek('lives')).toBe(2)

    sim.peek('items = [{ x: playerX, y: playerY, kind: "apple" }]')
    sim.tick()
    expect(sim.peek('score')).toBe(10)

    sim.peek('items = [{ x: 10, y: 100, kind: "bomb" }]')
    sim.tick()
    expect(sim.drawn).toContain('бомба')
  })

  it('звезда: поймал — плюс жизнь, упустил — не страшно', () => {
    let engine = withSetting(TUTORIAL_ENGINE, 'bombPic', BOMB_LINE)
    engine = withSetting(engine, 'goldPic', GOLD_LINE)
    const sim = boot([engine, STEP_HERO, GOLD_APPLES, GOLD_CATCH])
    sim.peek('items = [{ x: playerX, y: playerY, kind: "gold" }]')
    sim.tick()
    expect(sim.peek('lives')).toBe(4)

    sim.peek('items = [{ x: 0, y: 499, kind: "gold" }]; playerX = 300')
    sim.tick()
    expect(sim.peek('lives')).toBe(4)

    sim.peek('items = [{ x: 10, y: 100, kind: "gold" }]')
    sim.tick()
    expect(sim.drawn).toContain('звезда')
  })

  it('makeItem: сначала «бомба?» (1 из 5), иначе «звезда?» (1 из 10), иначе яблоко', () => {
    let engine = withSetting(TUTORIAL_ENGINE, 'bombPic', BOMB_LINE)
    engine = withSetting(engine, 'goldPic', GOLD_LINE)
    const sim = boot([engine, STEP_HERO, GOLD_APPLES, GOLD_CATCH])
    // случайные числа по очереди из списка, потом — 0.5
    const kindAt = (...rs: number[]) =>
      sim.peek(
        `(function () { var rs = [${rs}], m = Math.random; Math.random = function () { return rs.length ? rs.shift() : 0.5; }; var k = makeItem().kind; Math.random = m; return k; })()`,
      )
    expect(kindAt(0.1)).toBe('bomb')
    expect(kindAt(0.5, 0.05)).toBe('gold')
    expect(kindAt(0.5, 0.5)).toBe('apple')
  })
})

describe('готовая версия', () => {
  it('+10 очков, бомба, звезда; корзина ездит', () => {
    const sim = boot(FINISHED_CODES)
    sim.tick()
    expect(sim.drawn).toContain('корзинка')
    sim.key('ArrowLeft', true)
    sim.tick()
    expect(sim.peek('playerX')).toBe(164)
    sim.key('ArrowLeft', false)
    sim.peek('items = [{ x: playerX, y: playerY, kind: "apple" }]')
    sim.tick()
    expect(sim.peek('score')).toBe(10)
    sim.peek('items = [{ x: playerX, y: playerY, kind: "gold" }]')
    sim.tick()
    expect(sim.peek('lives')).toBe(4)
    sim.peek('items = [{ x: playerX, y: playerY, kind: "bomb" }]')
    sim.tick()
    expect(sim.peek('lives')).toBe(3)
  })

  it('каждые 15 секунд всё ускоряется до потолка 8', () => {
    const sim = boot(FINISHED_CODES)
    sim.peek('lives = 1000000')
    expect(sim.peek('fallSpeed')).toBe(3)
    sim.tick(899)
    expect(sim.peek('frame')).toBe(900)
    expect(sim.peek('fallSpeed')).toBe(4)
    sim.tick(900 * 10)
    expect(sim.peek('fallSpeed')).toBe(8)
  })
})
