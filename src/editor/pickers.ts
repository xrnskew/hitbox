import { syntaxTree } from '@codemirror/language'
import type { EditorState, Range } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from '@codemirror/view'
import { pictureUrl } from '@/core/pictures.ts'

// Кнопка «Сменить» рядом со значением переменной: у `var shipPic = "ракета";` — с миниатюрой рисунка,
// у `var pipeColor = "#5ec639";` — с квадратиком цвета. Клик открывает окно выбора; имя рисунка или код
// цвета новичку не придумать, а тут он выбирает глазами. Окно рисует приложение, редактор только говорит,
// какие символы заменить.

/** Что выбирают в окне: рисунок, цвет или вариант развилки. */
export type PickKind = 'pic' | 'color' | 'choice'

export interface PickSpot {
  /** Что заменить: содержимое кавычек или пропуск развилки, [from, to). */
  from: number
  to: number
  kind: PickKind
  /** Куда прикрепить окно выбора. */
  rect: { left: number; top: number; bottom: number }
  /** У развилки: вопрос, варианты и её строка — окно показывает строку с каждым вариантом. */
  choice?: ChoiceView
}

/** Развилка в окне выбора: строка кода до и после пропуска. */
export interface ChoiceView {
  question: string
  options: string[]
  head: string
  tail: string
}

/** Строка объявляет рисунок: `var shipPic = `. Кнопка есть, даже если в кавычках пусто или опечатка. */
const PIC_VAR = /\b\w*Pic\s*=\s*$/
/** Строка объявляет цвет: `var pipeColor = `. Просто "#141414" в коде кнопку не получает — её было бы слишком много. */
const COLOR_VAR = /\b\w*Color\s*=\s*$/

/** Какая кнопка нужна строке в кавычках, если перед ней `before` (начало строки до кавычки). */
export function pickKind(before: string): 'pic' | 'color' | null {
  if (PIC_VAR.test(before)) return 'pic'
  if (COLOR_VAR.test(before)) return 'color'
  return null
}

type Spot = { from: number; to: number; kind: 'pic' | 'color' }

/** Значения переменных …Pic и …Color в диапазоне [from, to): позиции содержимого кавычек. */
export function pickSpots(state: EditorState, from = 0, to = state.doc.length): Spot[] {
  const out: Spot[] = []
  syntaxTree(state).iterate({
    from,
    to,
    enter(node) {
      if (node.name !== 'String') return
      const quote = state.doc.sliceString(node.from, node.from + 1)
      if (node.to - node.from < 2 || state.doc.sliceString(node.to - 1, node.to) !== quote) return false
      const line = state.doc.lineAt(node.from)
      if (line.number !== state.doc.lineAt(node.to).number) return false
      const kind = pickKind(state.doc.sliceString(line.from, node.from))
      if (kind) out.push({ from: node.from + 1, to: node.to - 1, kind })
      return false
    },
  })
  return out
}

class PickWidget extends WidgetType {
  readonly onPick: (view: EditorView, spot: PickSpot) => void
  readonly kind: 'pic' | 'color'
  /** Что сейчас в кавычках: рисунок для миниатюры или цвет для квадратика. */
  readonly value: string
  constructor(onPick: (view: EditorView, spot: PickSpot) => void, kind: 'pic' | 'color', value: string) {
    super()
    this.onPick = onPick
    this.kind = kind
    this.value = value
  }

  // позиция берётся в момент клика; DOM пересоздаём, только когда поменялось значение
  eq(other: PickWidget) {
    return other.kind === this.kind && other.value === this.value
  }

  toDOM(view: EditorView) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'cm-pick'
    const preview = document.createElement('span')
    if (this.kind === 'color') {
      btn.title = 'Выбрать цвет'
      btn.setAttribute('aria-label', 'Сменить цвет')
      preview.className = 'cm-pickSwatch'
      preview.style.background = this.value
    } else {
      btn.title = 'Выбрать картинку'
      btn.setAttribute('aria-label', 'Сменить картинку')
      preview.className = 'cm-pickPic'
      preview.style.backgroundImage = `url(${pictureUrl(this.value)})`
    }
    btn.append(preview, Object.assign(document.createElement('span'), { textContent: 'Сменить' }))
    // не даём редактору забрать фокус и сдвинуть курсор
    btn.addEventListener('mousedown', (e) => e.preventDefault())
    btn.addEventListener('click', () => {
      const pos = view.posAtDOM(btn)
      const line = view.state.doc.lineAt(pos)
      const spot = pickSpots(view.state, line.from, line.to).find((s) => s.to + 1 === pos)
      if (!spot) return
      const r = btn.getBoundingClientRect()
      this.onPick(view, { ...spot, rect: { left: r.left, top: r.top, bottom: r.bottom } })
    })
    return btn
  }

  ignoreEvent() {
    return true
  }
}

/** Кнопки «Сменить» после закрывающей кавычки у каждого рисунка и цвета на экране. */
export function pickButtons(onPick: (view: EditorView, spot: PickSpot) => void) {
  const build = (view: EditorView): DecorationSet => {
    const marks: Range<Decoration>[] = []
    for (const { from, to } of view.visibleRanges)
      for (const s of pickSpots(view.state, from, to)) {
        const widget = new PickWidget(onPick, s.kind, view.state.doc.sliceString(s.from, s.to).trim())
        marks.push(Decoration.widget({ widget, side: 1 }).range(s.to + 1))
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
        if (u.docChanged || u.viewportChanged || syntaxTree(u.startState) !== syntaxTree(u.state))
          this.decorations = build(u.view)
      }
    },
    { decorations: (v) => v.decorations },
  )
}
