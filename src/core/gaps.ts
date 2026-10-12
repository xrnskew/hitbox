import { stripComments } from './progress.ts'

// Развилка: кусок кода встаёт с пропуском [?], и в этом месте ученик сам выбирает вариант — знак, сравнение,
// число. Пропуск — не JavaScript, поэтому игра с ним не соберётся: проверка до запуска ловит его первым.
// Чистый модуль: без DOM.

/** Пропуск в коде. */
export const GAP = '[?]'

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Код без комментариев и без содержимого строк в кавычках: длина и переводы строк те же. */
function codeOnly(code: string): string {
  return stripComments(code).replace(
    /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g,
    (_m, q: string, body: string) => `${q}${' '.repeat(body.length)}${q}`,
  )
}

/** Где в коде пропуски: строка (с 1) и столбец (с 0). В строках в кавычках и комментариях — не пропуск. */
export function findGaps(code: string): { line: number; column: number }[] {
  const out: { line: number; column: number }[] = []
  codeOnly(code)
    .split('\n')
    .forEach((text, i) => {
      for (let at = text.indexOf(GAP); at >= 0; at = text.indexOf(GAP, at + GAP.length))
        out.push({ line: i + 1, column: at })
    })
  return out
}

/** Развилка в куске: что спросить и какие варианты дать на место пропуска. */
export interface Choice {
  /** Вопрос в окне вариантов: «Куда едет герой, когда жмёшь ←?» */
  question: string
  /** Варианты на место пропуска — в таком порядке они стоят в окне. С любым код правильный по синтаксису. */
  options: string[]
  /** Верный вариант: с ним код шага совпадает с готовым. */
  answer: string
}

/** Строка с развилкой в коде: где пропуск или выбранный вариант и что там сейчас. */
export interface ChoiceSpot {
  /** Строка (с 1). */
  line: number
  /** Столбцы того, что стоит на месте пропуска: [from, to). */
  from: number
  to: number
  /** Что стоит: пропуск или один из вариантов. */
  value: string
}

/**
 * Узнаёт строку развилки в коде с пропуском или с любым из вариантов на его месте. `pattern` — кусок
 * со строкой, где пропуск (`  if (playerX [?] 0)   playerX = 0;`).
 */
export function choiceMatcher(pattern: string, choice: Choice) {
  const line = pattern.split('\n').find((l) => l.includes(GAP))
  if (!line) throw new Error(`В куске нет пропуска ${GAP}: ${pattern}`)
  const [head, tail] = line
    .trim()
    .split(GAP)
    // пробелы ученик мог поставить по-своему, кавычки — любые
    .map((part) => escape(part).replace(/\s+/g, '\\s*').replace(/["']/g, `["']`))
  const values = [GAP, ...[...choice.options].sort((a, b) => b.length - a.length)].map(escape).join('|')
  const re = new RegExp(`(${head}\\s*)(${values})\\s*${tail}`)

  /** Развилка в строке `text` (номер `line`) или null. */
  const inLine = (text: string, n: number): ChoiceSpot | null => {
    const m = re.exec(text)
    if (!m) return null
    const from = m.index + m[1].length
    return { line: n, from, to: from + m[2].length, value: m[2] }
  }

  return {
    inLine,
    /** Первая строка развилки во всём коде (без комментариев) или null. */
    find(code: string): ChoiceSpot | null {
      const lines = stripComments(code).split('\n')
      for (let i = 0; i < lines.length; i++) {
        const spot = inLine(lines[i], i + 1)
        if (spot) return spot
      }
      return null
    },
  }
}
