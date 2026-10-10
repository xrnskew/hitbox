import type { EditorState } from '@codemirror/state'
import { StateEffect, StateField } from '@codemirror/state'
import { Decoration, type DecorationSet, EditorView, WidgetType } from '@codemirror/view'
import './slots.css'
import { typingField } from './typing.ts'

// Кусок кода, который добавляют кнопкой прямо в редакторе. Он «всплывает» призраком
// под строкой, куда встанет, — ученик видит место вставки, а не ищет его по гайду.
// Кусок-замена встаёт вместо строк: они зачёркнуты, призрак — под ними, на кнопке «Заменить».
// Что и где показывать, решает урок: редактор только рисует и зовёт onAdd.

export interface CodeSlot {
  /** Строка (с 1), под которой появится кусок. */
  after: number
  /** Сколько строк после `after` кусок заменяет (0 — просто вставка). */
  replace?: number
  /** Что будет вставлено — показывается призраком. */
  code: string
  /** Номер части и сколько всего, например 2 и 4. */
  n: number
  total: number
  title: string
  onAdd: () => void
}

/** По коду вкладки — какой кусок предложить сейчас (или ничего). */
export type SlotSource = (code: string) => CodeSlot | null

/** Пересчитать кусок без правки: квест сменился из-за другой вкладки или запуска. */
export const refreshSlots = StateEffect.define<null>()

const SWAP =
  '<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 5.5h9.5M10 3l2.5 2.5L10 8M13 10.5H3.5M6 8l-2.5 2.5L6 13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'

const PLUS =
  '<svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5v11M2.5 8h11" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'

class SlotWidget extends WidgetType {
  readonly slot: CodeSlot
  constructor(slot: CodeSlot) {
    super()
    this.slot = slot
  }

  get verb() {
    return this.slot.replace ? 'Заменить' : 'Добавить'
  }

  // та же часть с тем же кодом — DOM не пересоздаём, и анимация появления не повторяется
  eq(other: SlotWidget) {
    return (
      other.slot.n === this.slot.n && other.slot.code === this.slot.code && other.slot.replace === this.slot.replace
    )
  }

  toDOM() {
    const { slot } = this
    const wrap = document.createElement('div')
    wrap.className = slot.replace ? 'cm-slot cm-slot--swap' : 'cm-slot'
    const box = document.createElement('div')
    box.className = 'cm-slotBox'
    box.setAttribute('role', 'group')
    box.setAttribute('aria-label', `Часть ${slot.n} из ${slot.total}: ${slot.title}`)

    const head = document.createElement('div')
    head.className = 'cm-slotHead'
    const num = document.createElement('span')
    num.className = 'cm-slotNum'
    num.textContent = `${slot.n}/${slot.total}`
    const title = document.createElement('span')
    title.className = 'cm-slotTitle'
    title.textContent = slot.title
    const add = document.createElement('button')
    add.type = 'button'
    add.className = 'key key--sun key--s cm-slotAdd'
    add.setAttribute('aria-label', `${this.verb}: ${slot.title}`)
    add.innerHTML = `${slot.replace ? SWAP : PLUS}<span>${this.verb}</span>`
    add.addEventListener('click', () => slot.onAdd())
    head.append(num, title, add)

    const code = document.createElement('div')
    code.className = 'cm-slotCode'
    code.textContent = slot.code
    code.setAttribute('aria-hidden', 'true')

    box.append(head, code)
    wrap.append(box)
    return wrap
  }

  // клики по кнопке не должны двигать курсор редактора
  ignoreEvent() {
    return true
  }
}

const oldLine = Decoration.line({ class: 'cm-slotOld' })

export function codeSlots(source: SlotSource) {
  const build = (state: EditorState): DecorationSet => {
    // следующий кусок всплывает, когда предыдущий допечатан
    if (state.field(typingField, false)) return Decoration.none
    const slot = source(state.doc.toString())
    if (!slot) return Decoration.none
    const lines = state.doc.lines
    const swap = Math.max(0, Math.min(slot.replace ?? 0, lines - slot.after))
    const line = state.doc.line(Math.min(Math.max(slot.after + swap, 1), lines))
    // строки, которые кусок заменит, — зачёркнуты
    const old = Array.from({ length: swap }, (_, i) => oldLine.range(state.doc.line(slot.after + 1 + i).from))
    return Decoration.set([
      ...old,
      Decoration.widget({ widget: new SlotWidget(slot), block: true, side: 1 }).range(line.to),
    ])
  }
  return StateField.define<DecorationSet>({
    create: build,
    update: (deco, tr) =>
      tr.docChanged ||
      tr.effects.some((e) => e.is(refreshSlots)) ||
      !tr.startState.field(typingField, false) !== !tr.state.field(typingField, false)
        ? build(tr.state)
        : deco,
    provide: (f) => EditorView.decorations.from(f),
  })
}
