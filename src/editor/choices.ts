import type { EditorState, Range } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from '@codemirror/view'
import { type Choice, type ChoiceSpot, GAP } from '@/core/gaps.ts'
import './choices.css'
import type { ChoiceView, PickSpot } from './pickers.ts'

// Развилка в коде: пропуск [?] в строке, на месте которого ученик сам выбирает вариант. Пропуск рисуется
// жёлтой клавишей «?» — это следующий шаг; курсор перескакивает его целиком, Backspace стирает весь.
// Выбранный вариант остаётся обычным кодом, а в конце строки — тихая клавиша «Сменить», чтобы передумать.
// Какие строки — развилки, решает урок: редактор только рисует и зовёт onOpen.

/** Развилка в строке `text` (номер `line`) или null. */
export type ChoiceSource = (text: string, line: number) => { spot: ChoiceSpot; choice: Choice } | null

type Found = { from: number; to: number; value: string; view: ChoiceView }

/** Развилки в строках [from, to) документа: позиции того, что стоит на месте пропуска. */
function findChoices(state: EditorState, source: ChoiceSource, from: number, to: number): Found[] {
  const out: Found[] = []
  for (let n = state.doc.lineAt(from).number; n <= state.doc.lineAt(to).number; n++) {
    const line = state.doc.line(n)
    const hit = source(line.text, n)
    if (!hit) continue
    const { spot, choice } = hit
    out.push({
      from: line.from + spot.from,
      to: line.from + spot.to,
      value: spot.value,
      view: {
        question: choice.question,
        options: choice.options,
        head: line.text.slice(0, spot.from),
        tail: line.text.slice(spot.to),
      },
    })
  }
  return out
}

const rectOf = (el: HTMLElement) => {
  const r = el.getBoundingClientRect()
  return { left: r.left, top: r.top, bottom: r.bottom }
}

/** Пропуск: жёлтая клавиша «?» на его месте. */
class GapWidget extends WidgetType {
  readonly open: (el: HTMLElement) => void
  readonly question: string
  constructor(open: (el: HTMLElement) => void, question: string) {
    super()
    this.open = open
    this.question = question
  }

  eq(other: GapWidget) {
    return other.question === this.question
  }

  toDOM() {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'cm-choiceGap key--sun'
    btn.textContent = '?'
    btn.title = `${this.question} Нажми и выбери вариант`
    btn.setAttribute('aria-label', `Пропуск. ${this.question} Нажми и выбери вариант`)
    btn.addEventListener('mousedown', (e) => e.preventDefault())
    btn.addEventListener('click', () => this.open(btn))
    return btn
  }

  ignoreEvent() {
    return true
  }
}

const SWAP =
  '<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5.5h9.5M10 3l2.5 2.5L10 8M13 10.5H3.5M6 8l-2.5 2.5L6 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'

/** Вариант выбран: в конце строки — «Сменить», чтобы выбрать другой. */
class ChangeWidget extends WidgetType {
  readonly open: (el: HTMLElement) => void
  readonly value: string
  constructor(open: (el: HTMLElement) => void, value: string) {
    super()
    this.open = open
    this.value = value
  }

  eq(other: ChangeWidget) {
    return other.value === this.value
  }

  toDOM() {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'cm-choiceChange'
    btn.title = 'Выбрать другой вариант'
    btn.setAttribute('aria-label', `Сменить вариант: сейчас ${this.value}`)
    btn.innerHTML = `${SWAP}<span>Сменить</span>`
    btn.addEventListener('mousedown', (e) => e.preventDefault())
    btn.addEventListener('click', () => this.open(btn))
    return btn
  }

  ignoreEvent() {
    return true
  }
}

const chosenMark = Decoration.mark({ class: 'cm-choiceValue' })

/** Развилки на экране: пропуск — клавиша «?», выбранный вариант — подчёркнут, в конце строки — «Сменить». */
export function choiceButtons(source: ChoiceSource, onOpen: (view: EditorView, spot: PickSpot) => void) {
  const build = (view: EditorView): DecorationSet => {
    const marks: Range<Decoration>[] = []
    for (const { from, to } of view.visibleRanges)
      for (const f of findChoices(view.state, source, from, to)) {
        // позиция — в момент клика: код мог сдвинуться
        const open = (el: HTMLElement) => {
          const pos = view.posAtDOM(el)
          const line = view.state.doc.lineAt(pos)
          const now = findChoices(view.state, source, line.from, line.to)[0]
          if (now) onOpen(view, { from: now.from, to: now.to, kind: 'choice', choice: now.view, rect: rectOf(el) })
        }
        if (f.value === GAP) {
          marks.push(Decoration.replace({ widget: new GapWidget(open, f.view.question) }).range(f.from, f.to))
        } else {
          marks.push(chosenMark.range(f.from, f.to))
          const end = view.state.doc.lineAt(f.to).to
          marks.push(Decoration.widget({ widget: new ChangeWidget(open, f.value), side: 1 }).range(end))
        }
      }
    return Decoration.set(marks, true)
  }
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet
      constructor(view: EditorView) {
        this.decorations = build(view)
      }
      update(u: ViewUpdate) {
        if (u.docChanged || u.viewportChanged) this.decorations = build(u.view)
      }
    },
    {
      decorations: (v) => v.decorations,
      // пропуск — одно целое: курсор его перескакивает, Backspace стирает весь
      provide: (plugin) => EditorView.atomicRanges.of((view) => view.plugin(plugin)?.decorations ?? Decoration.none),
    },
  )
}
