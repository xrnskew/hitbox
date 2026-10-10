import { describe, expect, it } from 'vitest'
import { currentQuest, hereStation, lessonProgress, levelStates, stationList } from '@/core/levels.ts'
import { checkFinishedPassword } from '@/core/lock.ts'
import { isPicture } from '@/core/pictures.ts'
import { functionLines } from '@/core/progress.ts'
import { pickKind } from '@/editor/pickers.ts'
import { GUIDE_EXTRAS, GUIDE_STEPS } from '@/lessons/catch/guide.ts'
import { LESSONS } from '@/lessons/index.ts'
import {
  BOMB_APPLES,
  BOMB_CATCH,
  BOMB_LINE,
  GOLD_APPLES,
  GOLD_CATCH,
  GOLD_LINE,
  HERO_PIC,
  STEP_APPLES,
  STEP_CATCH,
  STEP_HERO,
  TUTORIAL_CODES,
  TUTORIAL_ENGINE,
} from '@/lessons/catch/tabs.ts'
import {
  CATCH_TASK,
  HERO_CREATE_TASK,
  HERO_DRAW_TASK,
  HERO_MOVE_TASK,
  HERO_PICK_TASK,
  HERO_RUN_TASK,
  FALL_SPEED_TASK,
  ITEMS_DRAW_TASK,
  ITEMS_MOVE_TASK,
  SPEED_TASK,
  SPEEDUP_TASK,
  TEN_POINTS_TASK,
} from '@/lessons/catch/tasks.ts'
import { editTarget } from '@/lessons/kit.ts'
import { apply, build } from './build.ts'
import { boot } from './sim.ts'

/** Движок со своими настройками; яблоки по умолчанию падают со скоростью 3. */
const engineWith = (speed = 0, item = 'яблоко', fall = 3) =>
  TUTORIAL_ENGINE.replace('var playerSpeed = 0;', `var playerSpeed = ${speed};`)
    .replace('var fallSpeed   = 0;', `var fallSpeed   = ${fall};`)
    .replace('var itemPic     = "яблоко";', `var itemPic     = "${item}";`)
const heroWith = (pic: string) => STEP_HERO.replace(`"${HERO_PIC}"`, `"${pic}"`)

describe('шаг 1: героя собирают по кусочкам', () => {
  const start = TUTORIAL_CODES[1]

  it('создать → нарисовать → движение: получается код шага', () => {
    expect(build(start, HERO_CREATE_TASK, HERO_DRAW_TASK, HERO_MOVE_TASK)).toBe(`${start}\n\n${STEP_HERO}`)
  })

  it('кусок встаёт в конец функции, перед её }', () => {
    const shell = apply(start, HERO_DRAW_TASK.pieces[0].plan(start)!)
    expect(functionLines(shell, 'drawPlayer')).toEqual({ open: 4, close: 5 })
    expect(HERO_DRAW_TASK.pieces[1].plan(shell)).toMatchObject({ after: 4 })
    // функции ещё нет или она в одну строку — места для куска нет
    expect(HERO_DRAW_TASK.pieces[1].plan(start)).toBeNull()
    expect(HERO_DRAW_TASK.pieces[1].plan('function drawPlayer() {}')).toBeNull()
  })

  it('«Выбери героя»: засчитано, только когда смайлик другой; кнопка выделяет смайлик', () => {
    const hero = build(start, HERO_CREATE_TASK)
    expect(HERO_PICK_TASK.isDone(hero)).toBe(false)
    expect(HERO_PICK_TASK.isDone(hero.replace(HERO_PIC, 'кот'))).toBe(true)
    expect(HERO_PICK_TASK.isDone(hero.replace(HERO_PIC, ''))).toBe(false)
    const at = editTarget(hero, HERO_PICK_TASK.target)!
    expect(hero.split('\n')[at.line - 1].slice(at.from, at.to)).toBe(HERO_PIC)
  })

  it('«Собери игру» засчитан по коду последнего запуска, а не по редактору', () => {
    const drawn = build(start, HERO_CREATE_TASK, HERO_DRAW_TASK)
    expect(HERO_RUN_TASK.isDone([TUTORIAL_ENGINE, start])).toBe(false)
    expect(HERO_RUN_TASK.isDone([TUTORIAL_ENGINE, drawn])).toBe(true)
  })

  it('скорость в движке — 0: герой нарисован, но стоит, пока её не поменяют', () => {
    expect(SPEED_TASK.isDone(TUTORIAL_ENGINE)).toBe(false)
    expect(SPEED_TASK.isDone(engineWith(6))).toBe(true)
    expect(SPEED_TASK.isDone(engineWith(5.5))).toBe(true)
    expect(SPEED_TASK.text).toContain('от 5 до 7')
    const at = editTarget(TUTORIAL_ENGINE, SPEED_TASK.target)!
    expect(TUTORIAL_ENGINE.split('\n')[at.line - 1].slice(at.from, at.to)).toBe('0')

    const still = boot([TUTORIAL_ENGINE, heroWith('кот'), TUTORIAL_CODES[2], TUTORIAL_CODES[3]])
    still.key('ArrowRight', true)
    still.tick(5)
    expect(still.peek('playerX')).toBe(170)
    expect(still.drawn).toContain('кот')

    const moving = boot([engineWith(3), heroWith('кот'), TUTORIAL_CODES[2], TUTORIAL_CODES[3]])
    moving.key('ArrowRight', true)
    moving.tick(5)
    expect(moving.peek('playerX')).toBe(170 + 3 * 5)
  })

  it('квесты идут по порядку, и текущий — первый невыполненный', () => {
    const quest = (codes: string[], ran = codes) => currentQuest(GUIDE_STEPS, levelStates(GUIDE_STEPS, codes, ran))
    const codes = [...TUTORIAL_CODES]
    expect(quest(codes)).toEqual({ step: 0, quest: 0 })
    codes[1] = build(start, HERO_CREATE_TASK)
    expect(quest(codes)).toEqual({ step: 0, quest: 1 })
    codes[1] = codes[1].replace(HERO_PIC, 'кот')
    expect(quest(codes)).toEqual({ step: 0, quest: 2 })
    codes[1] = build(codes[1], HERO_DRAW_TASK)
    // нарисовали, но ещё не собирали
    expect(quest(codes, TUTORIAL_CODES)).toEqual({ step: 0, quest: 3 })
    expect(quest(codes)).toEqual({ step: 0, quest: 4 })
    codes[1] = build(codes[1], HERO_MOVE_TASK)
    expect(quest(codes)).toEqual({ step: 0, quest: 5 })
    expect(levelStates(GUIDE_STEPS, codes)[1].unlocked).toBe(false)
    codes[0] = engineWith(3)
    expect(quest(codes)).toEqual({ step: 1, quest: 0 })
    expect(levelStates(GUIDE_STEPS, codes)[0].done).toBe(true)
  })
})

describe('шаг 2: яблоки по кусочкам', () => {
  it('падают → рисуются: получается код шага', () => {
    const start = TUTORIAL_CODES[2]
    expect(build(start, ITEMS_MOVE_TASK, ITEMS_DRAW_TASK)).toBe(`${start}\n\n${STEP_APPLES}`)
  })

  it('«Дай яблокам скорость»: в движке 0 — яблоки висят, после 3 — падают', () => {
    expect(FALL_SPEED_TASK.isDone(TUTORIAL_ENGINE)).toBe(false)
    expect(FALL_SPEED_TASK.isDone(engineWith(6, 'яблоко', 3))).toBe(true)
    const at = editTarget(TUTORIAL_ENGINE, FALL_SPEED_TASK.target)!
    expect(TUTORIAL_ENGINE.split('\n')[at.line - 1].slice(at.from, at.to)).toBe('0')

    const hanging = boot([engineWith(6, 'яблоко', 0), heroWith('кот'), STEP_APPLES, TUTORIAL_CODES[3]])
    hanging.tick(70)
    expect(hanging.peek('items[0].y')).toBe(0)
    const falling = boot([engineWith(6, 'яблоко', 3), heroWith('кот'), STEP_APPLES, TUTORIAL_CODES[3]])
    falling.tick(70)
    expect(falling.peek<number>('items[0].y')).toBeGreaterThan(20)
  })

  it('квест скорости яблок — сразу после «Нарисуй яблоки»', () => {
    const codes = [engineWith(6, 'яблоко', 0), heroWith('кот'), STEP_APPLES, TUTORIAL_CODES[3]]
    expect(currentQuest(GUIDE_STEPS, levelStates(GUIDE_STEPS, codes))).toEqual({ step: 1, quest: 2 })
    codes[0] = engineWith(6)
    expect(currentQuest(GUIDE_STEPS, levelStates(GUIDE_STEPS, codes))).toEqual({ step: 1, quest: 3 })
  })

  it('«Всё быстрее»: части нельзя добавить раньше предыдущих', () => {
    const [, cond, step, call] = SPEEDUP_TASK.pieces
    expect(cond.plan(STEP_APPLES)).toBeNull()
    expect(step.plan(STEP_APPLES)).toBeNull()
    expect(call.plan(STEP_APPLES)).toBeNull()
  })

  it('«Всё быстрее»: собранная функция ускоряет каждые 15 секунд, но не быстрее 8', () => {
    const code = build(STEP_APPLES, SPEEDUP_TASK)
    expect(code).toContain('  frame = frame + 1;\n  speedUp();')
    const sim = boot([engineWith(3), heroWith('кот'), code, STEP_CATCH])
    sim.peek('lives = 1000000')
    sim.tick(899)
    expect(sim.peek('fallSpeed')).toBe(4)
    sim.tick(900 * 10)
    expect(sim.peek('fallSpeed')).toBe(8)
  })
})

describe('шаг 3: поимка по кусочкам', () => {
  it('получается код шага, и он работает', () => {
    const start = TUTORIAL_CODES[3]
    expect(build(start, CATCH_TASK)).toBe(`${start}\n\n${STEP_CATCH}`)
  })

  it('десять очков: засчитано, когда яблоко даёт 10; кнопка выделяет число', () => {
    expect(TEN_POINTS_TASK.isDone(STEP_CATCH)).toBe(false)
    expect(TEN_POINTS_TASK.isDone(STEP_CATCH.replace('score = score + 1;', 'score = score + 10;'))).toBe(true)
    expect(TEN_POINTS_TASK.isDone(STEP_CATCH.replace('score = score + 1;', 'score += 10;'))).toBe(true)
    const at = editTarget(STEP_CATCH, TEN_POINTS_TASK.target)!
    expect(STEP_CATCH.split('\n')[at.line - 1].slice(at.from, at.to)).toBe('1')
  })
})

describe('шаги открываются по очереди', () => {
  const step1 = [engineWith(3), heroWith('кот'), TUTORIAL_CODES[2], TUTORIAL_CODES[3]]

  it('в начале открыт только шаг 1', () => {
    expect(levelStates(GUIDE_STEPS, TUTORIAL_CODES).map((l) => l.unlocked)).toEqual([true, false, false])
  })

  it('шаг 2 открывается, когда выполнены все квесты героя', () => {
    expect(levelStates(GUIDE_STEPS, [TUTORIAL_ENGINE, ...step1.slice(1)])[1].unlocked).toBe(false)
    const levels = levelStates(GUIDE_STEPS, step1)
    expect(levels[0]).toMatchObject({ stepDone: true, current: -1, done: true })
    expect(levels[1].unlocked).toBe(true)
    expect(levels[2].unlocked).toBe(false)
  })

  it('шаг 2 пройден, только когда выполнены все его квесты', () => {
    const codes = [step1[0], step1[1], GOLD_APPLES, TUTORIAL_CODES[3]]
    // яблоки без скорости: квест «Дай яблокам скорость» не выполнен
    codes[0] = engineWith(6, 'яблоко', 0)
    expect(levelStates(GUIDE_STEPS, codes)[1]).toMatchObject({ questsDone: [true, true, false, true], done: false })
    codes[0] = engineWith(6)
    expect(levelStates(GUIDE_STEPS, codes)[1].done).toBe(true)
    expect(levelStates(GUIDE_STEPS, codes)[2].unlocked).toBe(true)
  })

  it('бомба и звезда закрыты, пока игра не собрана; звезда — ещё и до бомбы', () => {
    const lesson = { steps: GUIDE_STEPS, extras: GUIDE_EXTRAS }
    const extras = (codes: string[]) => lessonProgress(lesson, codes).extras
    expect(extras(TUTORIAL_CODES).map((x) => x.unlocked)).toEqual([false, false])
    const engine = `${engineWith(3)}\n${BOMB_LINE}`
    const withBomb = [engine, heroWith('кот'), BOMB_APPLES, BOMB_CATCH]
    expect(extras(withBomb).map((x) => x.unlocked)).toEqual([true, true])
    expect(extras(withBomb).map((x) => x.done)).toEqual([true, false])
    const withStar = [`${engine}\n${GOLD_LINE}`, heroWith('кот'), GOLD_APPLES, GOLD_CATCH]
    expect(extras(withStar).map((x) => x.done)).toEqual([true, true])
    // бонус засчитан, только когда его код собран: квест «Собери и проверь» смотрит на последний запуск
    expect(lessonProgress(lesson, withStar, withBomb).extras.map((x) => x.done)).toEqual([true, false])
  })

  it('код бомбы и звезды сохраняет все квесты яблок и поимки', () => {
    const levels = levelStates(GUIDE_STEPS, [engineWith(3, 'пончик'), heroWith('кот'), GOLD_APPLES, GOLD_CATCH])
    expect(levels.every((l) => l.done)).toBe(true)
  })
})

describe('станции карты', () => {
  const lesson = { steps: GUIDE_STEPS, extras: GUIDE_EXTRAS }
  const at = (codes: string[]) => stationList(lesson, lessonProgress(lesson, codes))

  it('шаги, бонусы и финиш; ты здесь — первая открытая', () => {
    const list = at(TUTORIAL_CODES)
    expect(list.map((s) => s.key)).toEqual(['step-1', 'step-2', 'step-3', 'extra-4', 'extra-5', 'finish'])
    expect(list.map((s) => s.state)).toEqual(['now', 'locked', 'locked', 'locked', 'locked', 'locked'])
    expect(hereStation(list).key).toBe('step-1')
  })

  it('у каждой игры: шаги 1…N, бонусы нумеруются дальше, ключи не повторяются, картинки есть в наборе', () => {
    for (const l of LESSONS) {
      const list = stationList(l, lessonProgress(l, l.tutorial.initial))
      expect(
        l.steps.map((s) => s.step),
        l.id,
      ).toEqual(l.steps.map((_, i) => i + 1))
      // номер бонуса — это id блока «guide-task-N» и подпись чек-поинта в шапке
      expect(
        l.extras.map((x) => x.n),
        l.id,
      ).toEqual(l.extras.map((_, i) => l.steps.length + i + 1))
      expect(new Set(list.map((s) => s.key)).size, l.id).toBe(list.length)
      for (const s of list) expect(isPicture(s.pic), `${l.id}: ${s.title} — ${s.pic}`).toBe(true)
      expect(hereStation(list).key, l.id).toBe('step-1')
    }
  })

  it('всё пройдено — ты на финише', () => {
    const engine = `${engineWith(3)}\n${BOMB_LINE}\n${GOLD_LINE}`
    const list = at([engine, heroWith('кот'), GOLD_APPLES, GOLD_CATCH])
    expect(list.every((s) => s.state === 'done')).toBe(true)
    expect(hereStation(list).key).toBe('finish')
  })
})

describe('кнопка «Сменить»', () => {
  it('у переменной …Pic — выбор картинки, даже если в кавычках пусто или опечатка', () => {
    expect(pickKind('var playerPic = ')).toBe('pic')
    expect(pickKind('var itemPic     = ')).toBe('pic')
    expect(pickKind('  shipPic = ')).toBe('pic')
  })

  it('у переменной …Color — выбор цвета, а не у любого кода цвета', () => {
    expect(pickKind('var pipeColor = ')).toBe('color')
    expect(pickKind('  pipeColor = ')).toBe('color')
    expect(pickKind('  ctx.fillStyle = ')).toBeNull()
  })

  it('нет у обычных строк', () => {
    for (const before of ['  ctx.fillText(', '  if (keys[', '  ctx.font = ', '  drawPic(', ''])
      expect(pickKind(before), before).toBeNull()
  })
})

describe('пароль готовой игры', () => {
  it('подходит только 000110', () => {
    expect(checkFinishedPassword('000110')).toBe(true)
    expect(checkFinishedPassword(' 000110 ')).toBe(true)
    for (const wrong of ['', '000111', '00011', '0001100', '110000']) expect(checkFinishedPassword(wrong)).toBe(false)
  })
})
