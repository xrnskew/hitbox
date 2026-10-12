import { parse } from 'acorn'
import { explainSyntax } from './errors.ts'
import { findGaps, GAP } from './gaps.ts'

// Синтаксис проверяется до запуска, по каждой вкладке отдельно. Браузер про незакрытую {
// сообщает только в конце склейки — не в той вкладке и не на той строке.

export interface SyntaxIssue {
  /** Номер строки внутри вкладки, с 1. */
  line: number
  /** Столбец, с 0. */
  column: number
  /** Уже переведённое сообщение. */
  message: string
  /** Это не ошибка, а пропуск развилки: вариант ещё не выбран. */
  gap?: boolean
}

const CLOSE: Record<string, string> = { '(': ')', '[': ']', '{': '}' }
const REGEX_AFTER = new Set('(,=:[!&|?{};+-*%<>~^'.split(''))
const REGEX_AFTER_WORD = new Set([
  'return',
  'typeof',
  'case',
  'do',
  'else',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'throw',
  'instanceof',
  'yield',
  'await',
])

interface Open {
  ch: string
  line: number
  col: number
  indent: number
  /** `${` внутри шаблонной строки. */
  tpl: boolean
}

const unclosed = (o: Open): SyntaxIssue => ({
  line: o.line,
  column: o.col,
  message: `скобка ${o.ch} открыта, но не закрыта — не хватает ${CLOSE[o.ch]}`,
})

/**
 * Сканер скобок: пропускает строки и комментарии, держит стек ( [ {, ищет лишнюю
 * или не ту закрывающую скобку. Для незакрытой { — эвристика отступов: если }
 * стоит левее строки, где открыта пара, она, скорее всего, закрыла чужую скобку.
 * Значит, забыли закрыть ту, что открыта на этой строке.
 */
export function scanBrackets(code: string): SyntaxIssue | null {
  const n = code.length
  const indents = code.split('\n').map((l) => {
    let w = 0
    for (const ch of l) {
      if (ch === ' ') w += 1
      else if (ch === '\t') w += 2
      else break
    }
    return w
  })
  const stack: Open[] = []
  let suspect: Open | null = null
  let line = 1
  let lineStart = 0
  let prev = ''
  let prevWord = ''
  let inTemplate = false
  let i = 0

  const newline = (at: number) => {
    line++
    lineStart = at + 1
  }
  // Перед скобкой на этой строке только пробелы и другие закрывающие скобки.
  const leadsLine = (at: number) => /^[\s)\]}]*$/.test(code.slice(lineStart, at))

  while (i < n) {
    const c = code[i]

    if (inTemplate) {
      if (c === '\\') {
        if (code[i + 1] === '\n') newline(i + 1)
        i += 2
      } else if (c === '\n') {
        newline(i)
        i++
      } else if (c === '`') {
        inTemplate = false
        prev = '`'
        i++
      } else if (c === '$' && code[i + 1] === '{') {
        stack.push({ ch: '{', line, col: i - lineStart + 1, indent: indents[line - 1], tpl: true })
        inTemplate = false
        prev = '{'
        i += 2
      } else i++
      continue
    }

    if (c === '\n') {
      newline(i)
      i++
      continue
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      i++
      continue
    }
    if (c === '/' && code[i + 1] === '/') {
      while (i < n && code[i] !== '\n') i++
      continue
    }
    if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2)
      const stop = end < 0 ? n : end + 2
      for (; i < stop; i++) if (code[i] === '\n') newline(i)
      continue
    }
    if (c === '"' || c === "'") {
      const startLine = line
      const startCol = i - lineStart
      i++
      while (i < n && code[i] !== c && code[i] !== '\n') i += code[i] === '\\' ? 2 : 1
      if (i >= n || code[i] !== c) return { line: startLine, column: startCol, message: `не закрыта кавычка ${c}` }
      i++
      prev = c
      prevWord = ''
      continue
    }
    if (c === '`') {
      inTemplate = true
      i++
      continue
    }
    if (c === '/' && (prev === '' || REGEX_AFTER.has(prev) || REGEX_AFTER_WORD.has(prevWord))) {
      let j = i + 1
      let cls = false
      while (j < n && code[j] !== '\n') {
        const d = code[j]
        if (d === '\\') {
          j += 2
          continue
        }
        if (cls) cls = d !== ']'
        else if (d === '[') cls = true
        else if (d === '/') break
        j++
      }
      if (j < n && code[j] === '/') {
        i = j + 1
        while (i < n && /[a-z]/i.test(code[i])) i++
        prev = 'a'
        prevWord = ''
        continue
      }
    }
    if (c === '(' || c === '[' || c === '{') {
      stack.push({ ch: c, line, col: i - lineStart, indent: indents[line - 1], tpl: false })
      prev = c
      prevWord = ''
      i++
      continue
    }
    if (c === ')' || c === ']' || c === '}') {
      const top = stack[stack.length - 1]
      const col = i - lineStart
      if (!top) {
        if (suspect) return unclosed(suspect)
        return { line, column: col, message: `лишняя скобка ${c} — её нечему закрывать` }
      }
      if (CLOSE[top.ch] !== c) {
        if (suspect) return unclosed(suspect)
        return {
          line,
          column: col,
          message: `здесь ${c}, а нужна ${CLOSE[top.ch]} — она закрывает ${top.ch} из строки ${top.line}`,
        }
      }
      stack.pop()
      if (top.tpl) {
        inTemplate = true
        i++
        continue
      }
      if (!suspect && line !== top.line && indents[line - 1] < top.indent && leadsLine(i)) suspect = top
      prev = c
      prevWord = ''
      i++
      continue
    }
    if (/[\w$Ѐ-ӿ]/.test(c)) {
      let j = i
      while (j < n && /[\w$Ѐ-ӿ]/.test(code[j])) j++
      prevWord = code.slice(i, j)
      prev = 'a'
      i = j
      continue
    }
    prev = c
    prevWord = ''
    i++
  }

  if (stack.length) return unclosed(suspect ?? stack[stack.length - 1])
  // Скобки сошлись — эвристике отступов не верим: ошибка не в скобках.
  return null
}

/**
 * Синтаксическая ошибка во вкладке или null. Первым ловится пропуск развилки: вариант ещё не выбран.
 * Если acorn нашёл ошибку, дополнительно работает сканер скобок; берётся та ошибка, что стоит раньше.
 */
export function findSyntaxError(code: string): SyntaxIssue | null {
  const gap = findGaps(code)[0]
  if (gap) return { ...gap, gap: true, message: `здесь пропуск ${GAP} — нажми на него и выбери вариант` }
  let found: SyntaxIssue
  try {
    parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true })
    return null
  } catch (e) {
    const err = e as Error & { loc?: { line: number; column: number } }
    found = {
      line: err.loc?.line ?? 1,
      column: err.loc?.column ?? 0,
      message: explainSyntax(String(err.message)),
    }
  }
  const scan = scanBrackets(code)
  return scan && scan.line <= found.line ? scan : found
}

/** Первая по порядку склейки вкладка с синтаксической ошибкой. */
export function firstSyntaxError(codes: string[]): { tab: number; issue: SyntaxIssue } | null {
  for (let tab = 0; tab < codes.length; tab++) {
    const issue = findSyntaxError(codes[tab])
    if (issue) return { tab, issue }
  }
  return null
}
