import type { Lesson, StepTask } from '../lessons/types.ts'
import { stepDone } from './progress.ts'

// Уровни гайда: шаг — цепочка квестов (по одному, по порядку). Следующий шаг открывается,
// когда пройдены все уровни перед ним. Всё считается по коду, поэтому после перезагрузки прогресс тот же:
// квест «нажми «Собрать»» смотрит на код последнего запуска, а при загрузке игра запускается сама.

export interface LevelState {
  /** Функции шага объявлены и не пустые. */
  stepDone: boolean
  /** Какие квесты шага выполнены — по порядку. */
  questsDone: boolean[]
  /** Первый невыполненный квест; -1 — все выполнены. Квесты после него пока скрыты. */
  current: number
  /** Шаг и все квесты выполнены. */
  done: boolean
  /** Шаг открыт. */
  unlocked: boolean
}

/** Выполнен ли квест. `ran` — код последнего запуска (для квеста «нажми «Собрать»»). */
export function questDone(task: StepTask, codes: string[], ran: string[]): boolean {
  if (task.kind === 'run') return task.isDone(ran)
  const code = codes[task.tab]
  return task.kind === 'edit' ? task.isDone(code) : task.pieces.every((p) => p.isDone(code))
}

export function levelStates(steps: QuestLevel[], codes: string[], ran: string[] = codes): LevelState[] {
  const out: LevelState[] = []
  steps.forEach((step) => {
    const s = stepDone(codes[step.tab], step.fns)
    const questsDone = step.quests.map((q) => questDone(q, codes, ran))
    const current = questsDone.indexOf(false)
    // шаг, в котором что-то уже сделано, не прячем, даже если раньше что-то сломали
    const unlocked = out.every((l) => l.done) || questsDone.some(Boolean)
    out.push({ stepDone: s, questsDone, current, done: s && current < 0, unlocked })
  })
  return out
}

/** Квест, который ученик делает сейчас: первый невыполненный в первом непройденном шаге. */
export function currentQuest(steps: QuestLevel[], levels: LevelState[]): { step: number; quest: number } | null {
  const i = levels.findIndex((l) => !l.done)
  if (i < 0 || !levels[i].unlocked) return null
  const quest = levels[i].current
  // все квесты выполнены, но функции шага сломаны — квеста нет, есть ошибка в коде
  return quest < 0 || !steps[i].quests[quest] ? null : { step: i, quest }
}

/** Уровень цепочки квестов: шаг игры или бонусное задание. У бонуса нет своих функций — только квесты. */
export interface QuestLevel {
  tab: number
  fns: string[]
  quests: StepTask[]
}

/**
 * Вся цепочка квестов урока: сначала шаги, за ними бонусы. Бонус открывается, когда пройден уровень перед ним, —
 * первый бонус ждёт, пока собрана вся игра. Номер уровня в цепочке — тот же, что у квеста в контроллере.
 */
export function questChain(lesson: Pick<Lesson, 'steps' | 'extras'>): QuestLevel[] {
  return [...lesson.steps, ...lesson.extras.map((x) => ({ tab: x.quests[0].tab, fns: [], quests: x.quests }))]
}

/** Состояние бонуса — то же, что у шага: квесты по порядку, открыт ли, пройден ли. */
export type ExtraState = LevelState

export interface LessonProgress {
  levels: LevelState[]
  extras: ExtraState[]
  /** Все шаги пройдены вместе с квестами — открываются дополнительные задания. */
  allDone: boolean
}

/** Весь прогресс урока по коду: шаги с квестами и бонусы. `ran` — код последнего запуска. */
export function lessonProgress(lesson: Pick<Lesson, 'steps' | 'extras'>, codes: string[], ran = codes): LessonProgress {
  const all = levelStates(questChain(lesson), codes, ran)
  const levels = all.slice(0, lesson.steps.length)
  return { levels, extras: all.slice(lesson.steps.length), allDone: levels.every((l) => l.done) }
}

// ===== Станции карты =====
// Карта над гайдом — те же шаги и задания, что в гайде: станция на каждый шаг, на каждое бонусное задание и финиш.
// Под картой показана одна станция: выбранная учеником или та, где он сейчас.

export type StationState = 'done' | 'now' | 'open' | 'locked'

export interface Station {
  /** `step-1`, `extra-4`, `finish` — тот же ключ, что у чек-поинтов в шапке. */
  key: string
  kind: 'step' | 'extra' | 'finish'
  /** Номер шага или задания; у финиша — 0. */
  n: number
  title: string
  pic: string
  state: StationState
}

export function stationList(lesson: Pick<Lesson, 'steps' | 'extras'>, progress: LessonProgress): Station[] {
  const state = (s: { done: boolean; unlocked: boolean }): StationState =>
    s.done ? 'done' : s.unlocked ? 'open' : 'locked'
  const list: Station[] = [
    ...lesson.steps.map((s, i) => ({
      key: `step-${s.step}`,
      kind: 'step' as const,
      n: s.step,
      title: s.title,
      pic: s.pic,
      state: state(progress.levels[i]),
    })),
    ...lesson.extras.map((x, i) => ({
      key: `extra-${x.n}`,
      kind: 'extra' as const,
      n: x.n,
      title: x.title,
      pic: x.pic,
      state: state(progress.extras[i]),
    })),
  ]
  const all = list.every((s) => s.state === 'done')
  list.push({ key: 'finish', kind: 'finish', n: 0, title: 'Финиш', pic: 'подарок', state: all ? 'done' : 'locked' })
  // ты здесь — первая открытая станция; всё пройдено — финиш
  const here = list.findIndex((s) => s.state === 'open')
  if (here >= 0) list[here].state = 'now'
  return list
}

/** Станция «ты здесь»: текущая, а когда всё пройдено — финиш. */
export function hereStation(list: Station[]): Station {
  return list.find((s) => s.state === 'now') ?? list[list.length - 1]
}
