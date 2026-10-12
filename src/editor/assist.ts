import type { CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { type Diagnostic, linter } from '@codemirror/lint'
import { EditorView, hoverTooltip } from '@codemirror/view'
import type { SyntaxIssue } from '@/core/syntax.ts'
import type { Hint, HintSet } from '@/lessons/types.ts'

// Помощь новичку: живая проверка синтаксиса, автодополнение имён движка
// и подсказка по наведению мыши.

const SKIP_NODES = new Set(['String', 'TemplateString', 'LineComment', 'BlockComment'])

export function syntaxLinter(check: (code: string) => SyntaxIssue | null) {
  return linter(
    (view: EditorView): Diagnostic[] => {
      const issue = check(view.state.doc.toString())
      // пропуск развилки — не ошибка: он и так виден жёлтой клавишей «?»
      if (!issue || issue.gap) return []
      const doc = view.state.doc
      const line = doc.line(Math.min(Math.max(issue.line, 1), doc.lines))
      let from = Math.min(line.from + issue.column, line.to)
      let to = from
      if (from < line.to) {
        const word = /^[\w$]+/.exec(doc.sliceString(from, line.to))
        to = from + (word ? word[0].length : 1)
      } else if (line.from < line.to) {
        // ошибка в конце строки — подчёркиваем всю строку
        from = line.from
        to = line.to
      }
      return [{ from, to, severity: 'error', message: issue.message }]
    },
    { delay: 600 },
  )
}

function toOption(h: Hint) {
  return { label: h.name, type: h.kind, detail: h.detail, info: h.text, boost: 2 }
}

export function hintCompletions(hints: HintSet): CompletionSource {
  const globals = hints.globals.map(toOption)
  const members = Object.fromEntries(Object.entries(hints.members).map(([k, list]) => [k, list.map(toOption)]))

  return (ctx: CompletionContext): CompletionResult | null => {
    const node = syntaxTree(ctx.state).resolveInner(ctx.pos, -1)
    if (SKIP_NODES.has(node.name)) return null

    const member = ctx.matchBefore(/[\w$]+\.[\w$]*$/)
    if (member) {
      const obj = member.text.slice(0, member.text.indexOf('.'))
      const options = members[obj]
      if (!options) return null
      return { from: member.from + obj.length + 1, options, validFor: /^[\w$]*$/ }
    }

    const word = ctx.matchBefore(/[\w$]+$/)
    if (!ctx.explicit && (!word || word.text.length < 2)) return null
    return { from: word ? word.from : ctx.pos, options: globals, validFor: /^[\w$]*$/ }
  }
}

export function hintHover(hints: HintSet) {
  const globals = new Map(hints.globals.map((h) => [h.name, h]))
  return hoverTooltip(
    (view, pos) => {
      const word = view.state.wordAt(pos)
      if (!word) return null
      const node = syntaxTree(view.state).resolveInner(pos, 1)
      if (SKIP_NODES.has(node.name)) return null
      const name = view.state.sliceDoc(word.from, word.to)
      const before = view.state.sliceDoc(Math.max(0, word.from - 20), word.from)
      const owner = /([\w$]+)\.$/.exec(before)?.[1]
      const hint = owner ? hints.members[owner]?.find((h) => h.name === name) : globals.get(name)
      if (!hint) return null
      return {
        pos: word.from,
        end: word.to,
        above: true,
        create() {
          const dom = document.createElement('div')
          dom.className = 'cm-hint'
          const b = document.createElement('b')
          b.textContent = (owner ? `${owner}.` : '') + name + (hint.detail ?? '')
          dom.append(b, ` — ${hint.text}`)
          return { dom }
        },
      }
    },
    { hoverTime: 350 },
  )
}
