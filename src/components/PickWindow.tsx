import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import type { Picker } from '@/app/controller.ts'
import { pictureUrl } from '@/core/pictures.ts'
import { PICTURE_GROUPS } from '@/core/pictures.ts'
import { CloseIcon } from './icons.tsx'
import styles from './PickWindow.module.css'

// Окно выбора рисунка или цвета у кнопки «Сменить» в коде. Имя рисунка или код цвета вроде #5ec639 новичок
// не придумает — здесь он выбирает глазами, и значение само встаёт между кавычками.

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

const WIDTH = 344
const GAP = 8
const EDGE = 12

export function PickWindow() {
  const picker = useApp((s) => s.picker)
  // key — новое окно на каждое открытие: своя позиция и свой фокус
  return picker ? <PickerBody key={`${picker.tab}:${picker.from}`} picker={picker} /> : null
}

function PickerBody({ picker }: { picker: Picker }) {
  const c = useController()
  const box = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // под кнопкой, а если не влезает — над ней; не вылезаем за края экрана
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const h = el.offsetHeight
    const w = Math.min(WIDTH, window.innerWidth - EDGE * 2)
    const left = Math.min(Math.max(picker.rect.left - 24, EDGE), window.innerWidth - w - EDGE)
    const below = picker.rect.bottom + GAP
    const top = below + h <= window.innerHeight - EDGE ? below : Math.max(EDGE, picker.rect.top - GAP - h)
    setPos({ left, top })
  }, [picker])

  useEffect(() => {
    box.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"], [data-value]')?.focus()
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) c.closePicker(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        c.closePicker()
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
  const heading = color ? 'Выбери цвет' : 'Выбери картинку'

  return (
    <div
      ref={box}
      className={styles.picker}
      role="dialog"
      aria-label={heading}
      style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}
    >
      <div className={styles.head}>
        <p>{heading}</p>
        <button
          type="button"
          className="key key--s key--icon key--ghost"
          aria-label="Закрыть"
          onClick={() => c.closePicker()}
        >
          <CloseIcon size={12} />
        </button>
      </div>
      {!color && (
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
      <div className={styles.groups} ref={list}>
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
