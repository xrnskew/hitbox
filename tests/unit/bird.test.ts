import { describe, expect, it } from 'vitest'
import { currentQuest, lessonProgress, levelStates } from '@/core/levels.ts'
import { isPicture } from '@/core/pictures.ts'
import { findSyntaxError } from '@/core/syntax.ts'
import { GUIDE_EXTRAS, GUIDE_STEPS } from '@/lessons/bird/guide.ts'
import {
  BIRD_PIC,
  COIN_HIT,
  COIN_LINE,
  COIN_PIPES,
  FAST_PIPES,
  FINISHED_CODES,
  MAX_SPEED_LINE,
  PIPE_COLOR,
  STEP_BIRD,
  STEP_FLAP,
  STEP_HIT,
  STEP_PIPES,
  TUTORIAL_CODES,
  TUTORIAL_ENGINE,
} from '@/lessons/bird/tabs.ts'
import {
  BIRD_CREATE_TASK,
  BIRD_DRAW_TASK,
  BIRD_FALL_TASK,
  BIRD_PICK_TASK,
  BIRD_RUN_TASK,
  FLAP_POWER_TASK,
  FLAP_TASK,
  GRAVITY_TASK,
  HIT_TASK,
  PIPE_COLOR_TASK,
  PIPE_SPEED_TASK,
  PIPES_DRAW_TASK,
  PIPES_MOVE_TASK,
  SCORE_TASK,
} from '@/lessons/bird/tasks.ts'
import { editTarget } from '@/lessons/kit.ts'
import { LESSONS, lessonById } from '@/lessons/index.ts'
import { build, withSetting } from './build.ts'
import { boot } from './sim.ts'

/** Бонусы по коду: открыты ли и пройдены ли — как их считает гайд. */
const extras = (codes: string[]) => lessonProgress({ steps: GUIDE_STEPS, extras: GUIDE_EXTRAS }, codes).extras

/** Движок со своими настройками: по умолчанию всё настроено, как в квестах. */
const engineWith = (gravity = 0.4, flap = 7, pipes = 2, color = '#e53935') =>
  TUTORIAL_ENGINE.replace('var gravity   = 0;', `var gravity   = ${gravity};`)
    .replace('var flapPower = 0;', `var flapPower = ${flap};`)
    .replace('var pipeSpeed = 0;', `var pipeSpeed = ${pipes};`)
    .replace(`var pipeColor = "${PIPE_COLOR}";`, `var pipeColor = "${color}";`)
const birdWith = (emoji: string) => STEP_BIRD.replace(`"${BIRD_PIC}"`, `"${emoji}"`)
/** Вся игра без дополнительных заданий. */
const fullGame = (engine = engineWith()) => [engine, birdWith('сова'), STEP_FLAP, STEP_PIPES, STEP_HIT]

describe('Птичка в меню', () => {
  it('стоит второй, после Корзинки, и открывается по ?game=bird', () => {
    expect(LESSONS.map((l) => l.id)).toEqual(['catch', 'bird', 'space'])
    expect(lessonById('bird')?.title).toBe('Птичка')
  })
})

describe('Птичка: код без ошибок', () => {
  it('все вкладки учебной и готовой версии, шаги и дополнительные задания разбираются', () => {
    for (const code of [...TUTORIAL_CODES, ...FINISHED_CODES, STEP_BIRD, STEP_FLAP, STEP_PIPES, STEP_HIT])
      expect(findSyntaxError(code)).toBeNull()
    for (const code of [COIN_PIPES, COIN_HIT, FAST_PIPES]) expect(findSyntaxError(code)).toBeNull()
  })
})

describe('Птичка: сборка по кусочкам даёт код шагов', () => {
  it('шаг 1: создать → нарисовать → падение', () => {
    const start = TUTORIAL_CODES[1]
    expect(build(start, BIRD_CREATE_TASK, BIRD_DRAW_TASK, BIRD_FALL_TASK)).toBe(`${start}\n\n${STEP_BIRD}`)
  })

  it('шаг 2: взмах', () => {
    expect(build(TUTORIAL_CODES[2], FLAP_TASK)).toBe(`${TUTORIAL_CODES[2]}\n\n${STEP_FLAP}`)
  })

  it('шаг 3: трубы едут и рисуются', () => {
    expect(build(TUTORIAL_CODES[3], PIPES_MOVE_TASK, PIPES_DRAW_TASK)).toBe(`${TUTORIAL_CODES[3]}\n\n${STEP_PIPES}`)
  })

  it('шаг 4: столкновения, потом очко за трубу', () => {
    expect(build(TUTORIAL_CODES[4], HIT_TASK, SCORE_TASK)).toBe(`${TUTORIAL_CODES[4]}\n\n${STEP_HIT}`)
    // очко некуда добавить, пока нет цикла по трубам
    const noLoop = build(TUTORIAL_CODES[4], { ...HIT_TASK, pieces: HIT_TASK.pieces.slice(0, 2) })
    expect(SCORE_TASK.pieces[0].plan(noLoop)).toBeNull()
  })
})

describe('Птичка: квесты «поправь сам»', () => {
  it('«Выбери птицу»: засчитано, только когда смайлик другой; кнопка выделяет смайлик', () => {
    const bird = build(TUTORIAL_CODES[1], BIRD_CREATE_TASK)
    expect(BIRD_PICK_TASK.isDone(bird)).toBe(false)
    expect(BIRD_PICK_TASK.isDone(bird.replace(BIRD_PIC, 'сова'))).toBe(true)
    const at = editTarget(bird, BIRD_PICK_TASK.target)!
    expect(bird.split('\n')[at.line - 1].slice(at.from, at.to)).toBe(BIRD_PIC)
  })

  it('гравитация, сила взмаха и скорость труб — 0 в движке; засчитано любое число больше 0', () => {
    for (const [task, name] of [
      [GRAVITY_TASK, 'gravity'],
      [FLAP_POWER_TASK, 'flapPower'],
      [PIPE_SPEED_TASK, 'pipeSpeed'],
    ] as const) {
      expect(task.isDone(TUTORIAL_ENGINE), name).toBe(false)
      expect(task.isDone(engineWith()), name).toBe(true)
      const at = editTarget(TUTORIAL_ENGINE, task.target)!
      const line = TUTORIAL_ENGINE.split('\n')[at.line - 1]
      expect(line, name).toContain(name)
      expect(line.slice(at.from, at.to), name).toBe('0')
    }
    expect(GRAVITY_TASK.isDone(engineWith(0.25))).toBe(true)
  })

  it('«Цвет труб»: окно цветов у pipeColor в «Движке»; засчитан любой цвет, кроме зелёного', () => {
    expect(PIPE_COLOR_TASK.picker).toBe('color')
    expect(PIPE_COLOR_TASK.tab).toBe(0)
    expect(PIPE_COLOR_TASK.isDone(TUTORIAL_ENGINE)).toBe(false)
    expect(PIPE_COLOR_TASK.isDone(engineWith(0, 0, 0, '#5EC639'))).toBe(false)
    expect(PIPE_COLOR_TASK.isDone(engineWith(0, 0, 0, '#ec407a'))).toBe(true)
    expect(PIPE_COLOR_TASK.isDone(engineWith(0, 0, 0, 'gold'))).toBe(true)
    expect(PIPE_COLOR_TASK.isDone(engineWith(0, 0, 0, ''))).toBe(false)
    const at = editTarget(TUTORIAL_ENGINE, PIPE_COLOR_TASK.target)!
    expect(TUTORIAL_ENGINE.split('\n')[at.line - 1].slice(at.from, at.to)).toBe(PIPE_COLOR)
  })

  it('«Собери игру» засчитан по коду последнего запуска', () => {
    const drawn = build(TUTORIAL_CODES[1], BIRD_CREATE_TASK, BIRD_DRAW_TASK)
    expect(BIRD_RUN_TASK.isDone(TUTORIAL_CODES)).toBe(false)
    expect(BIRD_RUN_TASK.isDone([TUTORIAL_ENGINE, drawn])).toBe(true)
  })
})

describe('Птичка: квесты идут по порядку', () => {
  const quest = (codes: string[], ran = codes) => currentQuest(GUIDE_STEPS, levelStates(GUIDE_STEPS, codes, ran))

  it('от создания птицы до последнего квеста', () => {
    const codes = [...TUTORIAL_CODES]
    expect(quest(codes)).toEqual({ step: 0, quest: 0 })
    codes[1] = build(codes[1], BIRD_CREATE_TASK).replace(BIRD_PIC, 'сова')
    codes[1] = build(codes[1], BIRD_DRAW_TASK)
    expect(quest(codes, TUTORIAL_CODES)).toEqual({ step: 0, quest: 3 })
    codes[1] = build(codes[1], BIRD_FALL_TASK)
    expect(quest(codes)).toEqual({ step: 0, quest: 5 })
    codes[0] = engineWith(0.4, 0, 0)
    expect(quest(codes)).toEqual({ step: 1, quest: 0 })
    codes[2] = STEP_FLAP
    expect(quest(codes)).toEqual({ step: 1, quest: 1 })
    codes[0] = engineWith(0.4, 7, 0)
    expect(quest(codes)).toEqual({ step: 2, quest: 0 })
    codes[3] = STEP_PIPES
    expect(quest(codes)).toEqual({ step: 2, quest: 2 })
    codes[0] = engineWith(0.4, 7, 2, PIPE_COLOR)
    expect(quest(codes)).toEqual({ step: 2, quest: 3 })
    codes[0] = engineWith()
    expect(quest(codes)).toEqual({ step: 3, quest: 0 })
    codes[4] = build(TUTORIAL_CODES[4], HIT_TASK)
    expect(quest(codes)).toEqual({ step: 3, quest: 1 })
    codes[4] = STEP_HIT
    expect(quest(codes)).toBeNull()
    expect(levelStates(GUIDE_STEPS, codes).every((l) => l.done)).toBe(true)
  })

  it('монетки и скорость закрыты до сборки игры; их код сохраняет все квесты', () => {
    expect(extras(TUTORIAL_CODES).map((x) => x.unlocked)).toEqual([false, false])
    let engine = withSetting(engineWith(), 'coinPic', COIN_LINE)
    const coins = [engine, birdWith('сова'), STEP_FLAP, COIN_PIPES, COIN_HIT]
    expect(extras(coins).map((x) => x.done)).toEqual([true, false])
    expect(levelStates(GUIDE_STEPS, coins).every((l) => l.done)).toBe(true)
    engine = withSetting(engine, 'maxSpeed', MAX_SPEED_LINE)
    const fast = [engine, birdWith('сова'), STEP_FLAP, FAST_PIPES, COIN_HIT]
    expect(extras(fast).map((x) => x.done)).toEqual([true, true])
    expect(levelStates(GUIDE_STEPS, fast).every((l) => l.done)).toBe(true)
  })
})

describe('Птичка: игра', () => {
  it('фон чёрный, земли нет; трубы рисует drawPipe цветом pipeColor — с шапкой', () => {
    const sim = boot(fullGame(engineWith(0, 0, 0, '#ec407a')))
    sim.peek('pipes = [{ x: 200, top: 120, passed: false }]')
    sim.tick()
    expect(sim.fills[0]).toBe('#141414')
    expect(sim.fills).not.toContain('#ffffff')
    // две трубы, у каждой — тело и шапка своим цветом
    expect(sim.fills.filter((f) => f === '#ec407a')).toHaveLength(4)
  })

  it('после труб кисть непрозрачная: птица и монетки не затемняются', () => {
    const engine = withSetting(engineWith(0, 7, 0), 'coinPic', COIN_LINE)
    for (const codes of [fullGame(), [engine, birdWith('сова'), STEP_FLAP, COIN_PIPES, COIN_HIT], FINISHED_CODES]) {
      const sim = boot(codes)
      sim.peek('pipes = [{ x: 200, top: 120, passed: false, coin: true }]')
      sim.tick()
      // картинки — то, что нарисовано не текстом: имена из набора
      const pics = sim.drawn.flatMap((t, i) => (isPicture(t) ? [sim.textFills[i]] : []))
      expect(pics.length).toBeGreaterThan(0)
      for (const fill of pics) expect(fill).not.toMatch(/rgba/)
    }
  })

  it('движок без шагов запускается, ждёт пробела и рисует счёт', () => {
    const sim = boot(TUTORIAL_CODES)
    sim.tick()
    expect(sim.drawn).toEqual(['Счёт: 0', 'Жми пробел!'])
    sim.key(' ', true)
    sim.tick()
    expect(sim.peek('started')).toBe(true)
    expect(sim.drawn).toEqual(['Счёт: 0'])
  })

  it('до пробела птица висит, даже с гравитацией', () => {
    const sim = boot([engineWith(), birdWith('сова'), ...TUTORIAL_CODES.slice(2)])
    sim.tick(30)
    expect(sim.peek('birdY')).toBe(220)
    expect(sim.drawn).toContain('сова')
  })

  it('гравитация прибавляется к скорости, скорость — к высоте; внизу экрана птица останавливается', () => {
    const sim = boot([engineWith(0.5), STEP_BIRD, ...TUTORIAL_CODES.slice(2)])
    sim.key(' ', true)
    sim.tick()
    expect(sim.peek('speedY')).toBe(0.5)
    expect(sim.peek('birdY')).toBe(220.5)
    sim.tick()
    expect(sim.peek('speedY')).toBe(1)
    expect(sim.peek('birdY')).toBe(221.5)
    sim.tick(200)
    expect(sim.peek('birdY')).toBe(460)
    expect(sim.peek('speedY')).toBe(0)
  })

  it('гравитация 0 — птица висит и после пробела', () => {
    const sim = boot([engineWith(0), STEP_BIRD, ...TUTORIAL_CODES.slice(2)])
    sim.key(' ', true)
    sim.tick(30)
    expect(sim.peek('birdY')).toBe(220)
  })

  it('взмах даёт скорость вверх; выше неба не улететь', () => {
    const sim = boot([engineWith(0.4, 7), STEP_BIRD, STEP_FLAP, ...TUTORIAL_CODES.slice(3)])
    sim.key(' ', true)
    expect(sim.peek('speedY')).toBe(-7)
    sim.tick()
    expect(sim.peek('birdY')).toBeCloseTo(220 - 6.6)
    // новый взмах снова задаёт скорость вверх, как бы быстро птица ни падала
    sim.peek('speedY = 3')
    sim.key(' ', true)
    expect(sim.peek('speedY')).toBe(-7)
    sim.peek('birdY = 35; speedY = -20')
    sim.tick()
    expect(sim.peek('birdY')).toBe(30)
  })

  it('трубы появляются раз в pipeEvery кадров справа, едут влево и убираются за краем', () => {
    // без гравитации и столкновений: птица висит, трубы едут сквозь неё
    const sim = boot(fullGame(engineWith(0, 0, 2)))
    sim.peek('checkHit = function () {}')
    sim.key(' ', true)
    sim.tick(89)
    expect(sim.peek<unknown[]>('pipes').length).toBe(0)
    sim.tick()
    expect(sim.peek('pipes.length')).toBe(1)
    expect(sim.peek('pipes[0].x')).toBe(378)
    const top = sim.peek<number>('pipes[0].top')
    expect(top).toBeGreaterThanOrEqual(60)
    expect(top).toBeLessThan(260)
    sim.tick(250)
    expect(sim.peek<number>('pipes[0].x')).toBeGreaterThan(-60)
    expect(sim.peek<number>('pipes[0].x')).toBeLessThan(378)
  })

  it('ударилась о низ экрана — игра окончена, всё останавливается', () => {
    const sim = boot(fullGame())
    sim.key(' ', true)
    sim.peek('birdY = 455; speedY = 10')
    sim.tick()
    expect(sim.peek('gameOver')).toBe(true)
    sim.tick()
    expect(sim.drawn).toContain('Игра окончена')
    sim.key(' ', true)
    expect(sim.peek('speedY')).toBe(0)
  })

  it('задела трубу — игра окончена; пролетела в дырку — очко, один раз', () => {
    const sim = boot(fullGame(engineWith(0, 7, 2)))
    sim.key(' ', true)
    sim.peek('speedY = 0; birdY = 200; pipes = [{ x: 100, top: 100, passed: false }]')
    sim.tick()
    expect(sim.peek('gameOver')).toBe(false)

    sim.peek('pipes = [{ x: 30, top: 100, passed: false }]')
    sim.tick(5)
    expect(sim.peek('score')).toBe(1)
    expect(sim.peek('gameOver')).toBe(false)

    sim.peek('pipes = [{ x: 90, top: 200, passed: false }]')
    sim.tick()
    expect(sim.peek('gameOver')).toBe(true)
    expect(sim.peek('score')).toBe(1)
  })

  it('ниже дырки — тоже удар', () => {
    const sim = boot(fullGame(engineWith(0, 7, 2)))
    sim.key(' ', true)
    sim.peek('speedY = 0; birdY = 300; pipes = [{ x: 90, top: 100, passed: false }]')
    sim.tick()
    expect(sim.peek('gameOver')).toBe(true)
  })
})

describe('Птичка: монетки, скорость и готовая версия', () => {
  it('монетка в дырке даёт 5 очков, один раз', () => {
    const engine = withSetting(engineWith(0, 7, 0), 'coinPic', COIN_LINE)
    const sim = boot([engine, STEP_BIRD, STEP_FLAP, COIN_PIPES, COIN_HIT])
    sim.key(' ', true)
    sim.peek('speedY = 0; pipes = [{ x: 75, top: 150, passed: false, coin: true }]; birdY = 150 + pipeGap / 2 + 12')
    sim.tick()
    expect(sim.peek('score')).toBe(5)
    expect(sim.drawn).not.toContain('монетка')
    sim.tick()
    expect(sim.peek('score')).toBe(5)
    sim.peek('pipes = [{ x: 200, top: 150, passed: false, coin: true }]')
    sim.tick()
    expect(sim.drawn).toContain('монетка')
  })

  it('каждые 10 секунд трубы едут быстрее, до maxSpeed', () => {
    let engine = withSetting(engineWith(0, 7, 2), 'coinPic', COIN_LINE)
    engine = withSetting(engine, 'maxSpeed', MAX_SPEED_LINE)
    const sim = boot([engine, STEP_BIRD, STEP_FLAP, FAST_PIPES, COIN_HIT])
    sim.key(' ', true)
    sim.peek('checkHit = function () {}')
    sim.tick(599)
    expect(sim.peek('pipeSpeed')).toBe(2)
    sim.tick()
    expect(sim.peek('pipeSpeed')).toBe(2.5)
    sim.tick(600 * 20)
    expect(sim.peek('pipeSpeed')).toBe(5)
  })

  it('готовая версия: всё настроено, птица летает, есть монетки и ускорение', () => {
    const sim = boot(FINISHED_CODES)
    sim.tick()
    expect(sim.drawn).toContain('птичка')
    sim.key(' ', true)
    expect(sim.peek('speedY')).toBe(-7)
    expect(sim.peek('pipeSpeed')).toBe(2)
    expect(sim.peek('coinPic')).toBe('монетка')
    expect(sim.peek('maxSpeed')).toBe(5)
    expect(sim.peek('typeof speedUp')).toBe('function')
  })
})
