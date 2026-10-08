import type { GuideExtra, GuideStep, Lesson, StepTask } from '../lessons/types.ts'
import { partDone, stepDone, varLine } from './progress.ts'

// Уровни гайда: шаг — цепочка квестов (по одному, по порядку). Следующий шаг открывается,
// когда пройден предыдущий уровень. Всё считается по коду, поэтому после перезагрузки прогресс тот же:
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

export function levelStates(steps: GuideStep[], codes: string[], ran: string[] = codes): LevelState[] {
  const out: LevelState[] = []
  steps.forEach((step, i) => {
    const s = stepDone(codes[step.tab], step.fns)
    const questsDone = step.quests.map((q) => questDone(q, codes, ran))
    const current = questsDone.indexOf(false)
    // шаг, в котором что-то уже сделано, не прячем, даже если раньше что-то сломали
    const unlocked = i === 0 || out[i - 1].done || questsDone.some(Boolean)
    out.push({ stepDone: s, questsDone, current, done: s && current < 0, unlocked })
  })
  return out
}

/** Квест, который ученик делает сейчас: первый невыполненный в первом непройденном шаге. */
export function currentQuest(steps: GuideStep[], levels: LevelState[]): { step: number; quest: number } | null {
  const i = levels.findIndex((l) => !l.done)
  if (i < 0 || !levels[i].unlocked) return null
  const quest = levels[i].current
  // все квесты выполнены, но функции шага сломаны — квеста нет, есть ошибка в коде
  return quest < 0 || !steps[i].quests[quest] ? null : { step: i, quest }
}

export interface ExtraState {
  settingDone: boolean
  codeDone: boolean
  done: boolean
  unlocked: boolean
}

export function extraStates(extras: GuideExtra[], levelsDone: boolean, codes: string[]): ExtraState[] {
  const out: ExtraState[] = []
  extras.forEach((x, i) => {
    const settingDone = varLine(codes[x.setting.tab], x.setting.name) > 0
    const codeDone = x.codes.every((c) => partDone(codes[c.tab], c.marks))
    const done = settingDone && codeDone
    const unlocked = (i === 0 ? levelsDone : out[i - 1].done) || done
    out.push({ settingDone, codeDone, done, unlocked })
  })
  return out
}

export interface LessonProgress {
  levels: LevelState[]
  extras: ExtraState[]
  /** Все шаги пройдены вместе с квестами — открываются дополнительные задания. */
  allDone: boolean
}

/** Весь прогресс урока по коду: шаги с квестами и дополнительные задания. `ran` — код последнего запуска. */
export function lessonProgress(lesson: Pick<Lesson, 'steps' | 'extras'>, codes: string[], ran = codes): LessonProgress {
  const levels = levelStates(lesson.steps, codes, ran)
  const allDone = levels.every((l) => l.done)
  return { levels, extras: extraStates(lesson.extras, allDone, codes), allDone }
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
