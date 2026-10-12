import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import type { Picker } from '@/app/controller.ts'
import { pictureUrl } from '@/core/pictures.ts'
import { PICTURE_GROUPS } from '@/core/pictures.ts'
import type { ChoiceView } from '@/editor/pickers.ts'
import { CloseIcon } from './icons.tsx'
import styles from './PickWindow.module.css'

// Окно выбора у кнопки «Сменить» в коде: рисунок или цвет — значение встаёт между кавычками; у развилки —
// вариант на место пропуска [?]. Имя рисунка или код цвета вроде #5ec639 новичок не придумает — здесь он
// выбирает глазами. Варианты развилки не подсвечиваются верным или неверным: это покажет игра.

/** Палитра для переменных …Color: значение — код цвета, подпись — для экранного диктора и подсказки. */
const COLORS: { title: string; list: [string, string][] }[] = [
  {
    title: 'Цвета',
    list: [
      ['#5ec639', 'зелёный'],
      ['#2e7d32', 'тёмно-зелёный'],
      ['#26a69a', 'бирюзовый'],
      ['#4fc3f7', 'голубой'],
      ['#1e63d6', 'синий'],
      ['#7e57c2', 'фиолетовый'],
      ['#ec407a', 'розовый'],
      ['#e53935', 'красный'],
      ['#fb8c00', 'оранжевый'],
      ['#ffca28', 'жёлтый'],
      ['#c0ca33', 'салатовый'],
      ['#8d6e63', 'коричневый'],
      ['#b0bec5', 'серый'],
      ['#ffffff', 'белый'],
      ['#ffd700', 'золотой'],
      ['#ff80ab', 'светло-розовый'],
    ],
  },
]

const GAP = 8
const EDGE = 12

/** Строка развилки с вариантом: без отступа и лишних пробелов; длинное условие `if (…)` перед ней не показываем. */
function choiceLine(view: ChoiceView, option: string): { head: string; option: string; tail: string } {
  const squeeze = (s: string) => s.replace(/\s+/g, ' ')
  let head = squeeze(view.head).trimStart()
  const tail = squeeze(view.tail).trimEnd()
  const cut = head.lastIndexOf(') ')
  if (head.length + tail.length > 30 && cut > 0) head = head.slice(cut + 2)
  return { head, option, tail }
}

export function PickWindow() {
  const picker = useApp((s) => s.picker)
  // key — новое окно на каждое открытие: своя позиция и свой фокус
  return picker ? <PickerBody key={`${picker.tab}:${picker.from}`} picker={picker} /> : null
}

function PickerBody({ picker }: { picker: Picker }) {
  const c = useController()
  const box = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // под кнопкой, а если не влезает — над ней; не вылезаем за края экрана. Развилка — наоборот, сначала над
  // строкой: под ней обычно строка-образец (→ рядом с ←, правый край рядом с левым), её закрывать нельзя
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const h = el.offsetHeight
    const w = el.offsetWidth
    const left = Math.min(Math.max(picker.rect.left - 24, EDGE), window.innerWidth - w - EDGE)
    const below = picker.rect.bottom + GAP
    const above = picker.rect.top - GAP - h
    const fitsBelow = below + h <= window.innerHeight - EDGE
    const top = picker.kind === 'choice' && above >= EDGE ? above : fitsBelow ? below : Math.max(EDGE, above)
    setPos({ left, top })
  }, [picker])

  // фокус — когда окно встало на место (кадром позже). Пока место не найдено, окно прозрачное, но не скрытое:
  // в скрытое (visibility: hidden) фокус не попадёт и останется в коде,
  // а там Tab вставил бы отступ, Enter — перевод строки
  const placed = pos !== null
  useEffect(() => {
    if (!placed) return
    const frame = requestAnimationFrame(() => {
      const el = box.current
      const first =
        picker.kind === 'choice'
          ? el?.querySelector<HTMLButtonElement>('[data-value]')
          : el?.querySelector<HTMLButtonElement>('[aria-pressed="true"], [data-value]')
      first?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [placed, picker.kind])

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) c.closePicker(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        c.closePicker()
        return
      }
      // варианты развилки: ↑ ↓ — по списку, цифра — выбрать сразу
      const options = [...(box.current?.querySelectorAll<HTMLButtonElement>('[data-option]') ?? [])]
      if (!options.length) return
      const at = options.indexOf(document.activeElement as HTMLButtonElement)
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const step = e.key === 'ArrowDown' ? 1 : -1
        options[(at + step + options.length) % options.length].focus()
      } else if (/^[1-9]$/.test(e.key) && options[Number(e.key) - 1]) {
        e.preventDefault()
        options[Number(e.key) - 1].click()
      }
    }
    // прокрутили код или страницу — кнопка уехала, окно закрываем. Кроме первых мгновений: на узком экране
    // кнопка «Сменить» бывает видна наполовину, и нажатие сначала докручивает её — это не уход от окна
    const openedAt = performance.now()
    const onScroll = (e: Event) => {
      if (performance.now() - openedAt < 400) return
      if (!box.current?.contains(e.target as Node)) c.closePicker(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [c])

  // к группе — прокруткой самого списка: прокрутка страницы закрыла бы окно
  const list = useRef<HTMLDivElement>(null)
  const jumpTo = (title: string) => {
    const el = list.current
    const section = el?.querySelector<HTMLElement>(`[data-group="${title}"]`)
    if (!el || !section) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ top: section.offsetTop - 4, behavior: calm ? 'auto' : 'smooth' })
  }

  const current = picker.was.trim().toLowerCase()
  const color = picker.kind === 'color'
  const choice = picker.kind === 'choice' ? picker.choice : undefined
  const heading = choice ? 'Выбери вариант' : color ? 'Выбери цвет' : 'Выбери картинку'
  // у развилки заголовок — вопрос урока: «Жмёшь ← — что делаем с playerX?»
  const title = choice ? choice.question : heading

  return (
    <div
      ref={box}
      className={styles.picker}
      data-kind={picker.kind}
      role="dialog"
      aria-label={heading}
      style={pos ? { left: pos.left, top: pos.top } : { opacity: 0 }}
    >
      <div className={styles.head} data-choice={!!choice}>
        <p>{title}</p>
        <button
          type="button"
          className="key key--s key--icon key--ghost"
          aria-label="Закрыть"
          onClick={() => c.closePicker()}
        >
          <CloseIcon size={12} />
        </button>
      </div>
      {choice && (
        <div className={styles.choice}>
          <div className={styles.options} role="group" aria-label="Варианты">
            {choice.options.map((opt, i) => {
              const line = choiceLine(choice, opt)
              const now = opt === picker.was
              return (
                <button
                  key={opt}
                  type="button"
                  className={styles.option}
                  data-value={opt}
                  data-option
                  aria-pressed={now}
                  aria-label={`${i + 1}: ${line.head}${opt}${line.tail}${now ? ' — сейчас' : ''}`}
                  aria-keyshortcuts={String(i + 1)}
                  onClick={() => c.pick(opt)}
                >
                  <kbd aria-hidden="true">{i + 1}</kbd>
                  <code aria-hidden="true">
                    {line.head}
                    <b>{opt}</b>
                    {line.tail}
                  </code>
                  {now && <span className={styles.now}>сейчас</span>}
                </button>
              )
            })}
          </div>
          <p className={styles.note}>Верный ли вариант, покажет игра: выбери, нажми «Собрать» и проверь.</p>
        </div>
      )}
      {!color && !choice && (
        <nav className={styles.jump} aria-label="Группы">
          {PICTURE_GROUPS.map((g) => (
            <button
              key={g.title}
              type="button"
              className={styles.jumpKey}
              title={g.title}
              aria-label={g.title}
              onClick={() => jumpTo(g.title)}
            >
              <img src={pictureUrl(g.names[0])} alt="" width={22} height={22} />
            </button>
          ))}
        </nav>
      )}
      <div className={styles.groups} ref={list} hidden={!!choice}>
        {color &&
          COLORS.map((g) => (
            <section key={g.title} aria-label={g.title}>
              <div className={styles.colorGrid}>
                {g.list.map(([value, name]) => (
                  <button
                    key={value}
                    type="button"
                    className={styles.color}
                    style={{ background: value }}
                    data-value={value}
                    aria-label={name}
                    title={name}
                    aria-pressed={value === current}
                    onClick={() => c.pick(value)}
                  />
                ))}
              </div>
            </section>
          ))}
        {!color &&
          !choice &&
          PICTURE_GROUPS.map((g) => (
            <section key={g.title} aria-label={g.title} data-group={g.title}>
              <h3>{g.title}</h3>
              <div className={styles.grid}>
                {g.names.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={styles.pic}
                    data-value={name}
                    aria-label={name}
                    title={name}
                    aria-pressed={name === current}
                    onClick={() => c.pick(name)}
                  >
                    <img src={pictureUrl(name)} alt="" width={34} height={34} />
                  </button>
                ))}
              </div>
            </section>
          ))}
      </div>
    </div>
  )
}
