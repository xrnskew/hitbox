import { planSettingInsert } from '../core/insert.ts'
import { functionLines, stripComments, varLine } from '../core/progress.ts'
import type { BuildPiece, BuildTask, EditTask, InsertPlan, Rich, RunTask } from './types.ts'

// Общие помощники для квестов любой игры. Чистые функции: проверяют код и говорят, куда вставить кусок.
// Совпадения ищутся в коде без комментариев, а номера строк — те же, что в исходном.

const linesOf = (code: string) => stripComments(code).split('\n')

/** Номер строки (с 1), где впервые совпало; 0 — нигде. */
export function lineOf(code: string, re: RegExp): number {
  return linesOf(code).findIndex((l) => re.test(l)) + 1
}

export const has = (code: string, re: RegExp) => re.test(stripComments(code))

/** Кусок — под строкой, где совпало `re`; null — такой строки ещё нет. */
export function after(code: string, re: RegExp, text: string): InsertPlan | null {
  const line = lineOf(code, re)
  return line ? { after: line, text } : null
}

/** Кусок — над строкой, где совпало `re`; null — такой строки ещё нет. */
export function before(code: string, re: RegExp, text: string): InsertPlan | null {
  const line = lineOf(code, re)
  return line ? { after: line - 1, text } : null
}

/** Кусок — под блоком `{ … }`, который начинается со строки, где совпало `re`. */
export function afterBlock(code: string, re: RegExp, text: string): InsertPlan | null {
  const start = lineOf(code, re)
  if (!start) return null
  const lines = linesOf(code)
  let depth = 0
  for (let i = start - 1; i < lines.length; i++) {
    for (const ch of lines[i]) depth += ch === '{' ? 1 : ch === '}' ? -1 : 0
    if (depth <= 0 && i >= start - 1 && lines[i].includes('}')) return { after: i + 1, text }
  }
  return null
}

/** Кусок вместо строки, где совпало `re`, и ещё `count - 1` строк под ней; null — такой строки нет. */
export function swap(code: string, re: RegExp, text: string, count = 1): InsertPlan | null {
  const line = lineOf(code, re)
  return line ? { after: line - 1, text, replace: count } : null
}

/** Строка настройки `var name = …;` в «Движок»: под строками с рисунками, иначе под заголовком настроек. */
export function settingPiece(title: string, name: string, line: string): BuildPiece {
  return {
    title,
    plan: (code) => {
      const p = planSettingInsert(code, name, line)
      return p.kind === 'insert' ? { after: p.after, text: line } : null
    },
    isDone: (code) => varLine(code, name) > 0,
  }
}

/** Новая функция или переменная — в конец вкладки, через пустую строку. */
export const append =
  (text: string) =>
  (code: string): InsertPlan => ({ after: code.split('\n').length, text: `\n${text}` })

/** Кусок — в конец тела функции `name`, перед её закрывающей }. */
export const into =
  (name: string, text: string) =>
  (code: string): InsertPlan | null => {
    const f = functionLines(code, name)
    // функция на одной строке, `function f() {}`: места внутри нет
    return f && f.close > f.open ? { after: f.close - 1, text } : null
  }

/** Объявление функции без параметров: `function name() {`. */
export const decl = (name: string) => new RegExp(`\\bfunction\\s+${name}\\s*\\(\\s*\\)\\s*\\{`)

/** Пустая функция — первая часть любой сборки. */
export const shell = (name: string): BuildPiece => ({
  title: `Пустая функция ${name}`,
  plan: append(`function ${name}() {\n}`),
  isDone: (code) => has(code, decl(name)),
})

/** Строка `var name = "…"` — что между кавычками: рисунок (`var shipPic = "ракета"`) или цвет (`"#5ec639"`). */
export const quoted = (name: string, code: string): string | null => {
  const m = new RegExp(`^\\s*var\\s+${name}\\s*=\\s*(["'])(.*?)\\1`, 'm').exec(stripComments(code))
  return m ? m[2].trim() : null
}

/** Рисунок ученика из `var name = "…"`: в склеенном скрипте побеждает объявление из поздней вкладки. */
export const chosenPic = (codes: string[], name: string): string | null =>
  codes
    .map((code) => quoted(name, code))
    .filter(Boolean)
    .at(-1) ?? null

/** Что выделить в строке `var name = "…"`: то, что между кавычками. */
export const quotedTarget = (name: string) => new RegExp(`var\\s+${name}\\s*=\\s*["'](?<value>[^"']*)["']`, 'd')

/** Число в строке `var name = …;`: засчитано, когда оно больше 0. */
export const numberAbove0 = (name: string) => (code: string) => {
  const m = new RegExp(`^\\s*var\\s+${name}\\s*=\\s*([\\d.]+)\\s*(;|$)`, 'm').exec(stripComments(code))
  return !!m && Number(m[1]) > 0
}

/** Что выделить в строке `var name = …;`: само число. */
export const numberTarget = (name: string) => new RegExp(`var\\s+${name}\\s*=\\s*(?<n>[^;\\s]*)`, 'd')

/** Что выделить для задания «поправь сам»: строка (с 1) и столбцы [from, to). */
export function editTarget(code: string, target: RegExp): { line: number; from: number; to: number } | null {
  const lines = code.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = new RegExp(target.source, target.flags.includes('d') ? target.flags : `${target.flags}d`).exec(lines[i])
    const span = m?.indices?.[1]
    if (span) return { line: i + 1, from: span[0], to: span[1] }
  }
  return null
}

// ===== Готовые квесты: одинаковые во всех играх, отличаются только именами и текстами =====

/** «Создай героя»: строка `var name = "рисунок";` в конец вкладки. */
export function createPicQuest(o: {
  title: string
  text: Rich
  tab: number
  /** Имя переменной и рисунок, с которого начинают. */
  name: string
  pic: string
  /** Подпись куска («Картинка героя») и комментарий над строкой («герой — любая картинка»). */
  piece: string
  comment: string
  doneText: string
}): BuildTask {
  const declared = new RegExp(`\\bvar\\s+${o.name}\\s*=`)
  return {
    kind: 'build',
    title: o.title,
    text: o.text,
    tab: o.tab,
    pieces: [
      {
        title: o.piece,
        plan: append(`// ${o.comment}\nvar ${o.name} = "${o.pic}";`),
        isDone: (code) => has(code, declared),
      },
    ],
    doneText: o.doneText,
  }
}

/** «Нарисуй героя»: пустая функция → `drawPic(рисунок, x, y)` — готовая функция движка. */
export function drawPicQuest(o: {
  title: string
  text: Rich
  tab: number
  fn: string
  /** Переменная с рисунком и координаты: `drawPic(pic, x, y)`. */
  pic: string
  x: string
  y: string
  doneText: string
}): BuildTask {
  const drawn = new RegExp(`\\bdrawPic\\s*\\(\\s*${o.pic}\\s*,\\s*${o.x}\\s*,\\s*${o.y}\\s*\\)`)
  return {
    kind: 'build',
    title: o.title,
    text: o.text,
    tab: o.tab,
    pieces: [
      shell(o.fn),
      {
        title: `Нарисовать картинку в точке ${o.x}, ${o.y}`,
        plan: into(o.fn, `  drawPic(${o.pic}, ${o.x}, ${o.y});`),
        isDone: (code) => has(code, drawn),
      },
    ],
    doneText: o.doneText,
  }
}

/** «Нажми «Собрать»»: засчитан, когда в последнем запуске были все куски квестов `after` (и выполнено `also`). */
export function runQuest(o: {
  title: string
  text: Rich
  callout: string
  doneText: string
  after: BuildTask[]
  also?: (ran: string[]) => boolean
}): RunTask {
  const tab = o.after[0].tab
  return {
    kind: 'run',
    title: o.title,
    text: o.text,
    tab,
    callout: o.callout,
    doneText: o.doneText,
    isDone: (ran) => o.after.every((t) => t.pieces.every((p) => p.isDone(ran[t.tab] ?? ''))) && (o.also?.(ran) ?? true),
  }
}

/** «Выбери героя»: кнопка открывает окно рисунков; засчитан любой рисунок, кроме исходного. */
export function pickPicQuest(o: {
  title: string
  text: Rich
  tab: number
  name: string
  /** Рисунок, с которого начинают: он не засчитывается. */
  pic: string
  hint: Rich
}): EditTask {
  return {
    kind: 'edit',
    title: o.title,
    text: o.text,
    tab: o.tab,
    target: quotedTarget(o.name),
    picker: 'pic',
    hint: [o.hint],
    isDone(code) {
      const pic = quoted(o.name, code)
      return !!pic && pic !== o.pic
    },
  }
}

/** «Выбери цвет»: кнопка открывает палитру; засчитан любой цвет, кроме исходного. */
export function pickColorQuest(o: {
  title: string
  text: Rich
  tab: number
  name: string
  color: string
  hint: Rich
}): EditTask {
  return {
    kind: 'edit',
    title: o.title,
    text: o.text,
    tab: o.tab,
    target: quotedTarget(o.name),
    picker: 'color',
    hint: [o.hint],
    isDone(code) {
      const color = quoted(o.name, code)
      return !!color && color.toLowerCase() !== o.color.toLowerCase()
    },
  }
}

/** «Дай герою скорость»: в «Движке» стоит 0, засчитано любое число больше 0. Кнопка выделяет число. */
export function numberQuest(o: { title: string; text: Rich; tab: number; name: string; hint: Rich }): EditTask {
  return {
    kind: 'edit',
    title: o.title,
    text: o.text,
    tab: o.tab,
    target: numberTarget(o.name),
    hint: [o.hint],
    isDone: numberAbove0(o.name),
  }
}

/** Применить кусок к тексту — так же, как редактор: вставить после строки или заменить строки. Для проверок. */
export function applyPlan(code: string, plan: InsertPlan): string {
  const lines = code.split('\n')
  lines.splice(plan.after, plan.replace ?? 0, ...plan.text.split('\n'))
  return lines.join('\n')
}

/** Собрать квест «по кусочкам» целиком: все куски по порядку. Для проверок. */
export function buildAll(task: BuildTask, code: string): string {
  for (const piece of task.pieces) {
    if (piece.isDone(code)) continue
    const plan = piece.plan(code)
    if (!plan) throw new Error(`«${task.title}»: нет места для «${piece.title}»`)
    code = applyPlan(code, plan)
    if (!piece.isDone(code)) throw new Error(`«${task.title}»: «${piece.title}» не засчитан после вставки`)
  }
  return code
}
