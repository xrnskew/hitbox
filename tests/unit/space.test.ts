import { describe, expect, it } from 'vitest'
import { currentQuest, lessonProgress, levelStates } from '@/core/levels.ts'
import { findSyntaxError } from '@/core/syntax.ts'
import { LESSONS, lessonById } from '@/lessons/index.ts'
import { editTarget } from '@/lessons/kit.ts'
import { GUIDE_EXTRAS, GUIDE_STEPS } from '@/lessons/space/guide.ts'
import { SPACE_HINTS } from '@/lessons/space/hints.ts'
import {
  BOOM_ENEMIES,
  BOOM_HITS,
  BOOM_LINE,
  BULLET_COLOR,
  ENEMY_PIC,
  FAST_ENEMIES,
  FINISHED,
  FINISHED_CODES,
  MAX_SPEED_LINE,
  SHIP_PIC,
  STEP_BULLETS,
  STEP_ENEMIES,
  STEP_HITS,
  STEP_SHIP,
  TUTORIAL_CODES,
  TUTORIAL_ENGINE,
} from '@/lessons/space/tabs.ts'
import {
  BEAM_RUN_TASK,
  BREACH_TASK,
  BULLET_COLOR_TASK,
  BULLET_SPEED_TASK,
  BULLETS_DRAW_TASK,
  BULLETS_MOVE_TASK,
  ENEMIES_DRAW_TASK,
  ENEMY_PICK_TASK,
  ENEMY_SPEED_TASK,
  HITS_TASK,
  RELOAD_TASK,
  RELOAD_TIME_TASK,
  SCORE_TASK,
  SHIP_CREATE_TASK,
  SHIP_DRAW_TASK,
  SHIP_MOVE_TASK,
  SHIP_PICK_TASK,
  SHIP_RUN_TASK,
  SHIP_SPEED_TASK,
  SHOOT_TASK,
  WAVE_TASK,
  ZIGZAG_TASK,
} from '@/lessons/space/tasks.ts'
import type { BuildTask, EditTask } from '@/lessons/types.ts'
import { apply, build, withSetting } from './build.ts'
import { boot, type Sim } from './sim.ts'

/** Бонусы по коду: открыты ли и пройдены ли — как их считает гайд. */
const extras = (codes: string[]) => lessonProgress({ steps: GUIDE_STEPS, extras: GUIDE_EXTRAS }, codes).extras

/** Движок со своими настройками: по умолчанию всё настроено, как в квестах. */
const engineWith = (ship = 6, bullet = 9, reload = 15, enemy = 1) =>
  TUTORIAL_ENGINE.replace('var shipSpeed   = 0;', `var shipSpeed   = ${ship};`)
    .replace('var bulletSpeed = 0;', `var bulletSpeed = ${bullet};`)
    .replace('var reloadTime  = 0;', `var reloadTime  = ${reload};`)
    .replace('var enemySpeed  = 0;', `var enemySpeed  = ${enemy};`)
/** Вся игра без дополнительных заданий. */
const fullGame = (engine = engineWith()) => [engine, STEP_SHIP, STEP_BULLETS, STEP_ENEMIES, STEP_HITS]
/** Игра со взрывами — после задания 5. */
const boomGame = (engine = engineWith()) => [
  withSetting(engine, 'boomPic', BOOM_LINE),
  STEP_SHIP,
  STEP_BULLETS,
  BOOM_ENEMIES,
  BOOM_HITS,
]
/** Игра после обоих заданий. */
const fastGame = (engine = engineWith()) => {
  const [boomEngine, ...rest] = boomGame(engine)
  return [withSetting(boomEngine, 'maxSpeed', MAX_SPEED_LINE), ...rest.slice(0, 2), FAST_ENEMIES, BOOM_HITS]
}

const n = (sim: Sim, expr: string) => sim.peek<number>(expr)

describe('Космос: код без ошибок', () => {
  it('все вкладки учебной и готовой версии, шаги и дополнительные задания разбираются', () => {
    const all = [...TUTORIAL_CODES, ...FINISHED_CODES, STEP_SHIP, STEP_BULLETS, STEP_ENEMIES, STEP_HITS]
    for (const code of [...all, BOOM_ENEMIES, BOOM_HITS, FAST_ENEMIES]) expect(findSyntaxError(code)).toBeNull()
  })

  it('каждый шаг по отдельности проходит кадры без ошибки: все массивы объявлены в «Движке»', () => {
    const steps = [STEP_SHIP, STEP_BULLETS, STEP_ENEMIES, STEP_HITS]
    for (const engine of [TUTORIAL_ENGINE, engineWith()])
      for (let i = 0; i < steps.length; i++) {
        const codes = [...TUTORIAL_CODES]
        codes[0] = engine
        codes[i + 1] = steps[i]
        const sim = boot(codes)
        sim.key(' ', true)
        expect(() => sim.tick(30), `шаг ${i + 1}`).not.toThrow()
      }
    expect(() => boot(fullGame(TUTORIAL_ENGINE)).tick(30)).not.toThrow()
    expect(() => boot(boomGame()).tick(30)).not.toThrow()
  })
})

describe('Космос: движок', () => {
  it('без шагов запускается: тёмный космос, 40 звёзд, луна, счёт, жизни и волна', () => {
    const sim = boot(TUTORIAL_CODES)
    sim.tick()
    expect(sim.fills[0]).toBe('#0b0d1a')
    expect(sim.fills.filter((f) => f === '#8b93b8')).toHaveLength(40)
    expect(sim.drawn).toEqual(['луна', 'Счёт: 0', 'Жизни: 3', 'Волна: 0'])
  })

  it('луна полупрозрачная, а смайлики и надписи после неё — нет', () => {
    for (const codes of [fullGame(), boomGame(), FINISHED_CODES]) {
      const sim = boot(codes)
      sim.peek('booms = [{ x: 200, y: 300, t: 20 }]')
      sim.tick()
      const moon = sim.drawn.indexOf('луна')
      expect(sim.textAlphas[moon]).toBe(0.5)
      const rest = sim.textAlphas.filter((_, i) => i !== moon)
      expect(rest.length).toBeGreaterThan(5)
      for (const a of rest) expect(a).toBe(1)
    }
  })
})

describe('Космос: корабль', () => {
  it('летает стрелками со скоростью shipSpeed и не вылетает за край', () => {
    const sim = boot(fullGame())
    sim.tick()
    expect(sim.drawn).toContain(SHIP_PIC)
    sim.key('ArrowRight', true)
    sim.tick(10)
    expect(n(sim, 'shipX')).toBe(230)
    sim.tick(100)
    expect(n(sim, 'shipX')).toBe(340)
    sim.key('ArrowRight', false)
    sim.key('ArrowLeft', true)
    sim.tick(100)
    expect(n(sim, 'shipX')).toBe(0)
  })

  it('shipSpeed 0 — корабль стоит', () => {
    const sim = boot(fullGame(engineWith(0)))
    sim.key('ArrowLeft', true)
    sim.tick(30)
    expect(n(sim, 'shipX')).toBe(170)
  })
})

describe('Космос: пули и перезарядка', () => {
  /** Пули без попаданий: проверяем только, как они вылетают и летят. */
  const shooting = (engine: string) => {
    const sim = boot(fullGame(engine))
    sim.peek('checkHits = function () {}')
    sim.key(' ', true)
    return sim
  }

  it('без перезарядки пуля вылетает каждый кадр — сплошной луч', () => {
    const sim = shooting(engineWith(6, 9, 0))
    sim.tick(10)
    expect(n(sim, 'bullets.length')).toBe(10)
    expect(sim.peek('bullets[9]')).toEqual({ x: 185, y: 416 - 9 })
  })

  it('с перезарядкой 15 — 4 выстрела в секунду; без пробела не стреляет', () => {
    const sim = shooting(engineWith(6, 0, 15))
    sim.tick(60)
    expect(n(sim, 'bullets.length')).toBe(4)
    sim.key(' ', false)
    sim.tick(60)
    expect(n(sim, 'bullets.length')).toBe(4)
  })

  it('пули летят вверх со скоростью bulletSpeed и пропадают за верхним краем', () => {
    const sim = shooting(engineWith(6, 9, 0))
    sim.tick(300)
    const ys = sim.peek<number[]>('bullets.map(function (b) { return b.y; })')
    expect(ys.length).toBeLessThan(60)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(-20 - 9)
    sim.key(' ', false)
    sim.tick(60)
    expect(n(sim, 'bullets.length')).toBe(0)
  })

  it('bulletSpeed 0 — пули копятся на месте', () => {
    const sim = shooting(engineWith(6, 0, 0))
    sim.tick(30)
    expect(n(sim, 'bullets.length')).toBe(30)
    expect(n(sim, 'bullets[29].y')).toBe(416)
  })

  it('пули рисуются цветом bulletColor', () => {
    const sim = shooting(engineWith(6, 9, 0).replace('"#ffd54a"', '"#ec407a"'))
    sim.tick(3)
    expect(sim.fills.filter((f) => f === '#ec407a')).toHaveLength(3)
  })
})

describe('Космос: волны пришельцев', () => {
  it('пришельцев нет — летит волна из waveSize: каждый в случайном месте, по одному сверху; сбили всех — следующая', () => {
    const sim = boot(fullGame(engineWith(6, 9, 15, 0)))
    sim.tick()
    expect(n(sim, 'wave')).toBe(1)
    const wave = sim.peek<{ x: number; y: number; dx: number }[]>('enemies')
    expect(wave.map((a) => a.y)).toEqual([40, -20, -80, -140, -200])
    for (const a of wave) {
      expect(a.x).toBeGreaterThanOrEqual(-2)
      expect(a.x).toBeLessThanOrEqual(342)
      expect(Math.abs(a.dx)).toBeGreaterThanOrEqual(0.5)
      expect(Math.abs(a.dx)).toBeLessThanOrEqual(2)
    }
    // места и скорости вбок у всех разные
    expect(new Set(wave.map((a) => a.x)).size).toBe(5)
    expect(sim.drawn.filter((t) => t === 'пришелец')).toHaveLength(5)
    sim.peek('enemies = []')
    sim.tick()
    expect(n(sim, 'wave')).toBe(2)
    expect(n(sim, 'enemies.length')).toBe(5)
  })

  it('спускаются со скоростью enemySpeed; enemySpeed 0 — висят', () => {
    let sim = boot(fullGame(engineWith(6, 9, 15, 0)))
    sim.tick(60)
    expect(n(sim, 'enemies[0].y')).toBe(40)
    // первый кадр движок делает сам, при запуске: волна уже спустилась на 1
    sim = boot(fullGame())
    sim.tick(10)
    expect(n(sim, 'enemies[0].y')).toBe(51)
  })

  it('летят вбок зигзагом: у края разворачиваются', () => {
    const sim = boot(fullGame(engineWith(6, 9, 15, 0)))
    sim.peek('enemies = [{ x: 339, y: 100, dx: 2 }, { x: 1, y: 100, dx: -2 }, { x: 150, y: 100, dx: 1.5 }]')
    sim.tick()
    expect(sim.peek('enemies.map(function (a) { return [a.x, a.dx]; })')).toEqual([
      [341, -2],
      [-1, 2],
      [151.5, 1.5],
    ])
    sim.tick()
    expect(sim.peek('enemies.map(function (a) { return a.x; })')).toEqual([339, 1, 153])
  })

  it('новая волна — крупная надпись «Волна N»: полторы секунды, в конце гаснет', () => {
    const sim = boot(fullGame())
    // волна 1 прилетела ещё при запуске
    sim.tick()
    let at = sim.drawn.indexOf('Волна 1')
    expect(at).toBeGreaterThan(-1)
    expect(sim.textAlphas[at]).toBe(1)
    expect(sim.textFills[at]).toBe('#ffd54a')
    sim.tick(70)
    at = sim.drawn.indexOf('Волна 1')
    expect(sim.textAlphas[at]).toBeLessThan(1)
    sim.tick(19)
    expect(sim.drawn).not.toContain('Волна 1')
    sim.peek('enemies = []')
    sim.tick()
    expect(sim.drawn).toContain('Волна 2')
  })

  it('размер волны — waveSize', () => {
    const sim = boot(fullGame(engineWith().replace('var waveSize    = 5;', 'var waveSize    = 3;')))
    sim.tick()
    expect(n(sim, 'enemies.length')).toBe(3)
  })
})

describe('Космос: попадание', () => {
  /** Без стрельбы и без движения: ставим пули и пришельцев руками. */
  const still = () => boot(fullGame(engineWith(6, 0, 15, 0)))

  it('пуля внутри рамки пришельца — сбит: очко, пропадают и он, и пуля', () => {
    const sim = still()
    sim.peek('enemies = [{ x: 100, y: 200, dx: 0 }, { x: 250, y: 200, dx: 0 }]; bullets = [{ x: 110, y: 180 }]')
    sim.tick()
    expect(n(sim, 'score')).toBe(1)
    expect(sim.peek('enemies')).toEqual([{ x: 250, y: 200, dx: 0 }])
    expect(n(sim, 'bullets.length')).toBe(0)
  })

  it('рядом с рамкой — мимо', () => {
    const sim = still()
    sim.peek(
      'enemies = [{ x: 100, y: 200, dx: 0 }]; bullets = [{ x: 135, y: 180 }, { x: 95, y: 180 }, { x: 110, y: 201 }]',
    )
    sim.tick()
    expect(n(sim, 'score')).toBe(0)
    expect(n(sim, 'bullets.length')).toBe(3)
  })

  it('две пули в одного пришельца — одно очко, вторая пуля летит дальше (break)', () => {
    const sim = still()
    sim.peek('enemies = [{ x: 100, y: 200, dx: 0 }]; bullets = [{ x: 110, y: 180 }, { x: 112, y: 185 }]')
    sim.tick()
    expect(n(sim, 'score')).toBe(1)
    expect(n(sim, 'bullets.length')).toBe(1)
  })

  it('одна пуля в двух пришельцев — сбит только один', () => {
    const sim = still()
    sim.peek('enemies = [{ x: 100, y: 200, dx: 0 }, { x: 104, y: 200, dx: 0 }]; bullets = [{ x: 110, y: 180 }]')
    sim.tick()
    expect(n(sim, 'score')).toBe(1)
    expect(n(sim, 'enemies.length')).toBe(1)
  })

  it('пришелец долетел до корабля — минус жизнь, он пропадает', () => {
    const sim = still()
    sim.peek('enemies = [{ x: 100, y: 441, dx: 0 }, { x: 200, y: 300, dx: 0 }]')
    sim.tick()
    expect(n(sim, 'lives')).toBe(2)
    expect(sim.peek('enemies')).toEqual([{ x: 200, y: 300, dx: 0 }])
  })

  it('без стрельбы жизни уходят по одной и не в минус; потом всё стоит и «Игра окончена»', () => {
    const sim = boot(fullGame())
    const seen = [3]
    for (let i = 0; i < 4000; i++) {
      sim.tick()
      const lives = n(sim, 'lives')
      if (lives !== seen[seen.length - 1]) seen.push(lives)
    }
    expect(seen).toEqual([3, 2, 1, 0])
    expect(sim.drawn).toContain('Игра окончена')
    expect(sim.drawn).toContain('Жизни: 0')
    const frozen = JSON.stringify(sim.peek('[enemies, shipX, frame]'))
    sim.key('ArrowLeft', true)
    sim.key(' ', true)
    sim.tick(30)
    expect(JSON.stringify(sim.peek('[enemies, shipX, frame]'))).toBe(frozen)
    expect(n(sim, 'bullets.length')).toBe(0)
  })

  it('корабль под пришельцем держит пробел — пуля долетает и сбивает его', () => {
    const sim = boot(fullGame(engineWith(6, 9, 12, 0)))
    sim.peek('enemies = [{ x: 160, y: 150, dx: 0 }]; shipX = 160')
    sim.key(' ', true)
    sim.tick(40)
    expect(n(sim, 'score')).toBe(1)
    expect(n(sim, 'lives')).toBe(3)
  })
})

describe('Космос: взрывы, «Волна за волной» и готовая версия', () => {
  it('сбил — на месте пришельца 💥 горит 20 кадров и гаснет', () => {
    const sim = boot(boomGame(engineWith(6, 0, 15, 0)))
    sim.peek('enemies = [{ x: 100, y: 200, dx: 0 }]; bullets = [{ x: 110, y: 180 }]')
    sim.tick()
    expect(n(sim, 'score')).toBe(1)
    expect(sim.peek('booms')).toEqual([{ x: 100, y: 200, t: 19 }])
    expect(sim.drawn).toContain('взрыв')
    sim.tick(18)
    expect(sim.drawn).toContain('взрыв')
    sim.tick()
    expect(n(sim, 'booms.length')).toBe(0)
    sim.tick()
    expect(sim.drawn).not.toContain('взрыв')
  })

  it('каждая новая волна быстрее на 0.25 и на одного пришельца больше, до maxSpeed', () => {
    // первая волна прилетает уже при запуске — с той скоростью и того размера, что в «Движке»
    const sim = boot(fastGame())
    expect(sim.peek('[wave, enemySpeed, enemies.length]')).toEqual([1, 1, 5])
    const waves: number[][] = []
    for (let i = 0; i < 6; i++) {
      sim.peek('enemies = []')
      sim.tick()
      waves.push(sim.peek('[enemySpeed, enemies.length]'))
    }
    expect(n(sim, 'wave')).toBe(7)
    expect(waves).toEqual([
      [1.25, 6],
      [1.5, 7],
      [1.75, 8],
      [2, 9],
      [2, 9],
      [2, 9],
    ])
  })

  it('готовая версия: всё настроено, есть взрывы и ускорение; автопилот сбивает волну за волной', () => {
    const sim = boot(FINISHED_CODES)
    expect(sim.peek('[shipSpeed, bulletSpeed, reloadTime, enemySpeed, boomPic, maxSpeed]')).toEqual([
      6,
      9,
      12,
      1,
      'взрыв',
      2,
    ])
    sim.key(' ', true)
    // автопилот, как игрок: летит стрелками под самого нижнего пришельца, туда, где он будет,
    // когда долетит пуля (упреждение), и держит пробел
    const aim =
      'var low = null; for (var q = 0; q < enemies.length; q++) if (enemies[q].y > 0 && (!low || enemies[q].y > low.y)) low = enemies[q];' +
      'if (low) { var tx = Math.max(0, Math.min(340, low.x + low.dx * (shipY - 34 - low.y) / (bulletSpeed + enemySpeed))) + 2;' +
      'keys.ArrowRight = shipX < tx - 3; keys.ArrowLeft = shipX > tx + 3; }'
    for (let i = 0; i < 3000; i++) {
      sim.peek(aim)
      sim.tick()
    }
    expect(n(sim, 'score')).toBeGreaterThan(30)
    expect(n(sim, 'wave')).toBeGreaterThan(5)
    expect(sim.peek('[enemySpeed, waveSize]')).toEqual([2, 9])
    expect(n(sim, 'lives')).toBeGreaterThan(0)
  })
})

describe('Космос: сборка по кусочкам даёт код шагов', () => {
  it('шаг 1: создать → нарисовать → полёт', () => {
    const start = TUTORIAL_CODES[1]
    expect(build(start, SHIP_CREATE_TASK, SHIP_DRAW_TASK, SHIP_MOVE_TASK)).toBe(`${start}\n\n${STEP_SHIP}`)
  })

  it('шаг 2: выстрел → полёт → отрисовка → перезарядка', () => {
    const start = TUTORIAL_CODES[2]
    expect(build(start, SHOOT_TASK, BULLETS_MOVE_TASK, BULLETS_DRAW_TASK, RELOAD_TASK)).toBe(
      `${start}\n\n${STEP_BULLETS}`,
    )
  })

  it('шаг 3: волна → отрисовка → зигзаг', () => {
    const start = TUTORIAL_CODES[3]
    expect(build(start, WAVE_TASK, ENEMIES_DRAW_TASK, ZIGZAG_TASK)).toBe(`${start}\n\n${STEP_ENEMIES}`)
  })

  it('шаг 4: вложенный цикл → очко → прорыв', () => {
    const start = TUTORIAL_CODES[4]
    expect(build(start, HITS_TASK, SCORE_TASK, BREACH_TASK)).toBe(`${start}\n\n${STEP_HITS}`)
  })

  it('куски, которым некуда встать, ждут своей очереди', () => {
    // перезарядку некуда вставить, пока нет shoot с выстрелом
    expect(RELOAD_TASK.pieces[0].plan(TUTORIAL_CODES[2])).toBeNull()
    expect(
      RELOAD_TASK.pieces[1].plan(build(TUTORIAL_CODES[2], { ...SHOOT_TASK, pieces: SHOOT_TASK.pieces.slice(0, 1) })),
    ).toBeNull()
    // волну некуда вставить, пока нет if
    expect(
      WAVE_TASK.pieces[2].plan(build(TUTORIAL_CODES[3], { ...WAVE_TASK, pieces: WAVE_TASK.pieces.slice(0, 1) })),
    ).toBeNull()
    // очко некуда добавить, пока нет if (popal)
    // зигзаг некуда вставить, пока пришельцы не спускаются
    expect(
      ZIGZAG_TASK.pieces[0].plan(build(TUTORIAL_CODES[3], { ...WAVE_TASK, pieces: WAVE_TASK.pieces.slice(0, 3) })),
    ).toBeNull()
    const noIf = build(TUTORIAL_CODES[4], { ...HITS_TASK, pieces: HITS_TASK.pieces.slice(0, 4) })
    expect(SCORE_TASK.pieces[0].plan(noIf)).toBeNull()
  })

  it('каждая промежуточная версия игры работает: кадры идут без ошибок', () => {
    const steps: [number, BuildTask[]][] = [
      [1, [SHIP_CREATE_TASK, SHIP_DRAW_TASK, SHIP_MOVE_TASK]],
      [2, [SHOOT_TASK, BULLETS_MOVE_TASK, BULLETS_DRAW_TASK, RELOAD_TASK]],
      [3, [WAVE_TASK, ENEMIES_DRAW_TASK, ZIGZAG_TASK]],
      [4, [HITS_TASK, SCORE_TASK, BREACH_TASK]],
    ]
    // остальные вкладки — уже готовые: так проверяется и работа куска вместе со всей игрой
    for (const [tab, tasks] of steps) {
      let code = TUTORIAL_CODES[tab]
      for (const task of tasks)
        for (const piece of task.pieces) {
          code = apply(code, piece.plan(code)!)
          const codes = fullGame()
          codes[tab] = code
          const sim = boot(codes)
          sim.key(' ', true)
          sim.key('ArrowRight', true)
          expect(() => sim.tick(120), piece.title).not.toThrow()
        }
    }
  })
})

describe('Космос: квесты «поправь сам»', () => {
  it('«Выбери корабль» и «Свой пришелец»: засчитано, только когда картинка другая; кнопка выделяет её имя', () => {
    const ship = build(TUTORIAL_CODES[1], SHIP_CREATE_TASK)
    for (const [task, code, pic] of [
      [SHIP_PICK_TASK, ship, SHIP_PIC],
      [ENEMY_PICK_TASK, TUTORIAL_ENGINE, ENEMY_PIC],
    ] as const) {
      expect(task.picker).toBe('pic')
      expect(task.isDone(code)).toBe(false)
      expect(task.isDone(code.replace(`"${pic}"`, '"тарелка"'))).toBe(true)
      expect(task.isDone(code.replace(`"${pic}"`, '""'))).toBe(false)
      const at = editTarget(code, task.target)!
      expect(code.split('\n')[at.line - 1].slice(at.from, at.to)).toBe(pic)
    }
  })

  it('скорости и перезарядка — 0 в движке; засчитано любое число больше 0, кнопка выделяет число', () => {
    const tasks: [EditTask, string][] = [
      [SHIP_SPEED_TASK, 'shipSpeed'],
      [BULLET_SPEED_TASK, 'bulletSpeed'],
      [RELOAD_TIME_TASK, 'reloadTime'],
      [ENEMY_SPEED_TASK, 'enemySpeed'],
    ]
    for (const [task, name] of tasks) {
      expect(task.tab, name).toBe(0)
      expect(task.isDone(TUTORIAL_ENGINE), name).toBe(false)
      expect(task.isDone(engineWith()), name).toBe(true)
      const at = editTarget(TUTORIAL_ENGINE, task.target)!
      const line = TUTORIAL_ENGINE.split('\n')[at.line - 1]
      expect(line, name).toContain(name)
      expect(line.slice(at.from, at.to), name).toBe('0')
    }
    expect(ENEMY_SPEED_TASK.isDone(engineWith(6, 9, 15, 0.25))).toBe(true)
  })

  it('«Цвет пуль»: окно цветов у bulletColor; засчитан любой цвет, кроме исходного жёлтого', () => {
    expect(BULLET_COLOR_TASK.picker).toBe('color')
    const withColor = (c: string) => TUTORIAL_ENGINE.replace(`"${BULLET_COLOR}"`, `"${c}"`)
    expect(BULLET_COLOR_TASK.isDone(TUTORIAL_ENGINE)).toBe(false)
    expect(BULLET_COLOR_TASK.isDone(withColor('#FFD54A'))).toBe(false)
    expect(BULLET_COLOR_TASK.isDone(withColor(''))).toBe(false)
    expect(BULLET_COLOR_TASK.isDone(withColor('#ec407a'))).toBe(true)
    expect(BULLET_COLOR_TASK.isDone(withColor('cyan'))).toBe(true)
    const at = editTarget(TUTORIAL_ENGINE, BULLET_COLOR_TASK.target)!
    expect(TUTORIAL_ENGINE.split('\n')[at.line - 1].slice(at.from, at.to)).toBe(BULLET_COLOR)
  })
})

describe('Космос: квесты «нажми «Собрать»»', () => {
  it('«Собери игру» засчитан по коду последнего запуска', () => {
    const drawn = build(TUTORIAL_CODES[1], SHIP_CREATE_TASK, SHIP_DRAW_TASK)
    expect(SHIP_RUN_TASK.isDone(TUTORIAL_CODES)).toBe(false)
    expect(SHIP_RUN_TASK.isDone([TUTORIAL_ENGINE, drawn])).toBe(true)
  })

  it('«Сплошной луч»: в запуске пули стреляют, летят и рисуются, а bulletSpeed больше 0', () => {
    const bullets = build(TUTORIAL_CODES[2], SHOOT_TASK, BULLETS_MOVE_TASK, BULLETS_DRAW_TASK)
    const ran = (engine: string, tab2: string) => [engine, STEP_SHIP, tab2]
    expect(BEAM_RUN_TASK.isDone(TUTORIAL_CODES)).toBe(false)
    expect(BEAM_RUN_TASK.isDone(ran(engineWith(6, 0), bullets))).toBe(false)
    expect(BEAM_RUN_TASK.isDone(ran(engineWith(6, 9), TUTORIAL_CODES[2]))).toBe(false)
    expect(BEAM_RUN_TASK.isDone(ran(engineWith(6, 9, 0), bullets))).toBe(true)
    // и луч правда сплошной: пуля каждый кадр
    const sim = boot([engineWith(6, 9, 0), STEP_SHIP, bullets, ...TUTORIAL_CODES.slice(3)])
    sim.key(' ', true)
    sim.tick(20)
    expect(n(sim, 'bullets.length')).toBe(20)
  })
})

describe('Космос в меню', () => {
  it('стоит третьей, после Корзинки и Птички, и открывается по ?game=space', () => {
    expect(LESSONS.map((l) => l.id)).toEqual(['catch', 'bird', 'space'])
    const lesson = lessonById('space')!
    expect(lesson.title).toBe('Космос')
    expect(lesson.card).toMatchObject({
      level: 'Сложно',
      levelBars: 4,
      scene: 'space',
      hero: 'ракета',
      item: 'пришелец',
    })
    expect(lesson.consoleColor).toBe('red')
  })

  it('на корпусе ← →, и «Огонь» шлёт пробел', () => {
    const { buttons } = lessonById('space')!.controls
    expect(buttons.map((b) => [b.key, b.label])).toEqual([
      ['ArrowLeft', 'Влево'],
      ['ArrowRight', 'Вправо'],
      [' ', 'Огонь'],
    ])
    expect(buttons[2].wide).toBe(true)
  })

  it('свои ключи сохранения — ни с какой другой игрой не совпадают', () => {
    const keys = LESSONS.flatMap((l) => [l.tutorial.storageKey, l.finished.storageKey])
    expect(new Set(keys).size).toBe(keys.length)
    expect(FINISHED.hasGuide).toBe(false)
    expect(FINISHED.features!.length).toBeGreaterThan(0)
  })

  it('22 квеста в 4 шагах; функции шага — в своей вкладке', () => {
    expect(GUIDE_STEPS.map((s) => s.quests.length)).toEqual([6, 8, 5, 3])
    for (const step of GUIDE_STEPS)
      for (const fn of step.fns) expect(step.code, fn).toMatch(new RegExp(`\\bfunction\\s+${fn}\\s*\\(`))
  })

  it('у каждого имени движка, корабля и заданий есть подсказка', () => {
    const src = [TUTORIAL_ENGINE, STEP_SHIP, BOOM_LINE, MAX_SPEED_LINE].join('\n')
    const names = [...src.matchAll(/^(?:var|function)\s+(\w+)/gm)].map((m) => m[1])
    const hinted = new Set(SPACE_HINTS.globals.map((h) => h.name))
    for (const name of names) expect(hinted.has(name), name).toBe(true)
    for (const name of SPACE_HINTS.watch) expect(hinted.has(name), name).toBe(true)
  })
})

describe('Космос: квесты идут по порядку', () => {
  const quest = (codes: string[], ran = codes) => currentQuest(GUIDE_STEPS, levelStates(GUIDE_STEPS, codes, ran))
  /** «Движок» после квестов: скорости, перезарядка, цвет пуль и пришелец. */
  const engine = (ship = 0, bullet = 0, reload = 0, enemy = 0, color = BULLET_COLOR, alien = ENEMY_PIC) =>
    engineWith(ship, bullet, reload, enemy)
      .replace(`"${BULLET_COLOR}"`, `"${color}"`)
      .replace(`"${ENEMY_PIC}"`, `"${alien}"`)

  it('от создания корабля до последнего квеста', () => {
    const codes = [...TUTORIAL_CODES]
    expect(quest(codes)).toEqual({ step: 0, quest: 0 })
    codes[1] = build(codes[1], SHIP_CREATE_TASK)
    expect(quest(codes)).toEqual({ step: 0, quest: 1 })
    codes[1] = build(codes[1].replace(SHIP_PIC, 'тарелка'), SHIP_DRAW_TASK)
    // «Собери игру» ждёт запуска
    expect(quest(codes, TUTORIAL_CODES)).toEqual({ step: 0, quest: 3 })
    codes[1] = build(codes[1], SHIP_MOVE_TASK)
    expect(quest(codes)).toEqual({ step: 0, quest: 5 })
    codes[0] = engine(6)
    expect(quest(codes)).toEqual({ step: 1, quest: 0 })

    codes[2] = build(codes[2], SHOOT_TASK)
    expect(quest(codes)).toEqual({ step: 1, quest: 1 })
    codes[2] = build(codes[2], BULLETS_MOVE_TASK)
    expect(quest(codes)).toEqual({ step: 1, quest: 2 })
    codes[2] = build(codes[2], BULLETS_DRAW_TASK)
    expect(quest(codes)).toEqual({ step: 1, quest: 3 })
    const beforeSpeed = [...codes]
    codes[0] = engine(6, 9)
    // «Сплошной луч» ждёт запуска с летящими пулями
    expect(quest(codes, beforeSpeed)).toEqual({ step: 1, quest: 4 })
    expect(quest(codes)).toEqual({ step: 1, quest: 5 })
    codes[2] = build(codes[2], RELOAD_TASK)
    expect(quest(codes)).toEqual({ step: 1, quest: 6 })
    codes[0] = engine(6, 9, 15)
    expect(quest(codes)).toEqual({ step: 1, quest: 7 })
    codes[0] = engine(6, 9, 15, 0, '#ec407a')
    expect(quest(codes)).toEqual({ step: 2, quest: 0 })

    codes[3] = build(codes[3], WAVE_TASK)
    expect(quest(codes)).toEqual({ step: 2, quest: 1 })
    codes[3] = build(codes[3], ENEMIES_DRAW_TASK)
    expect(quest(codes)).toEqual({ step: 2, quest: 2 })
    codes[0] = engine(6, 9, 15, 1, '#ec407a')
    expect(quest(codes)).toEqual({ step: 2, quest: 3 })
    codes[3] = build(codes[3], ZIGZAG_TASK)
    expect(quest(codes)).toEqual({ step: 2, quest: 4 })
    codes[0] = engine(6, 9, 15, 1, '#ec407a', 'осьминог')
    expect(quest(codes)).toEqual({ step: 3, quest: 0 })

    codes[4] = build(codes[4], HITS_TASK)
    expect(quest(codes)).toEqual({ step: 3, quest: 1 })
    codes[4] = build(codes[4], SCORE_TASK)
    expect(quest(codes)).toEqual({ step: 3, quest: 2 })
    codes[4] = build(codes[4], BREACH_TASK)
    expect(quest(codes)).toBeNull()
    expect(levelStates(GUIDE_STEPS, codes).every((l) => l.done)).toBe(true)
  })

  it('следующий шаг закрыт, пока не пройден предыдущий', () => {
    const levels = levelStates(GUIDE_STEPS, TUTORIAL_CODES)
    expect(levels.map((l) => l.unlocked)).toEqual([true, false, false, false])
  })

  it('взрывы и волны закрыты до сборки игры; их код сохраняет все квесты', () => {
    expect(extras(TUTORIAL_CODES).map((x) => x.unlocked)).toEqual([false, false])
    const base = engine(6, 9, 15, 1, '#ec407a', 'осьминог')
    const done = [base, STEP_SHIP.replace(SHIP_PIC, 'тарелка'), STEP_BULLETS, STEP_ENEMIES, STEP_HITS]
    expect(levelStates(GUIDE_STEPS, done).every((l) => l.done)).toBe(true)
    expect(extras(done).map((x) => x.done)).toEqual([false, false])

    const booms = boomGame(base)
    booms[1] = done[1]
    expect(extras(booms).map((x) => x.done)).toEqual([true, false])
    expect(levelStates(GUIDE_STEPS, booms).every((l) => l.done)).toBe(true)

    const fast = fastGame(base)
    fast[1] = done[1]
    expect(extras(fast).map((x) => x.done)).toEqual([true, true])
    expect(levelStates(GUIDE_STEPS, fast).every((l) => l.done)).toBe(true)
  })

  it('готовая версия засчитывает все шаги и оба задания', () => {
    const finished = [...FINISHED_CODES]
    finished[1] = finished[1].replace(SHIP_PIC, 'тарелка')
    finished[0] = finished[0].replace(`"${BULLET_COLOR}"`, '"#ec407a"').replace(`"${ENEMY_PIC}"`, '"👽"')
    expect(levelStates(GUIDE_STEPS, finished).every((l) => l.done)).toBe(true)
    expect(extras(finished).map((x) => x.done)).toEqual([true, true])
  })
})
