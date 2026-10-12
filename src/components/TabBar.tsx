import { type KeyboardEvent, type RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { type TabBadge, tabBadges, type View } from '@/app/controller.ts'
import { BadgeIcon, BookIcon, SlidersIcon } from './icons.tsx'
import styles from './TabBar.module.css'

const BADGE_TEXT: Record<TabBadge, string> = {
  engine: 'настройки и главный цикл',
  empty: 'пока только комментарий',
  code: 'есть код',
  done: 'шаг сделан',
  error: 'во вкладке ошибка',
}

export function TabBar() {
  const c = useController()
  const view = useApp((s) => s.view)
  const codes = useApp((s) => s.codes)
  const syntax = useApp((s) => s.syntax)
  const runtimeErrorTab = useApp((s) => s.runtimeErrorTab)
  const badges = useMemo(() => tabBadges(c, { codes, syntax, runtimeErrorTab }), [c, codes, syntax, runtimeErrorTab])

  const bar = useRef<HTMLDivElement>(null)
  const more = useMore(bar)

  // открытая вкладка всегда видна: полоса листается к ней сама (только вбок — страницу не трогаем)
  useEffect(() => {
    const el = bar.current
    const tab = document.getElementById(`tab-${String(view)}`)
    if (!el || !tab) return
    const from = tab.offsetLeft - 48
    const to = from + tab.offsetWidth + 96
    if (from < el.scrollLeft) el.scrollLeft = from
    else if (to > el.scrollLeft + el.clientWidth) el.scrollLeft = to - el.clientWidth
  }, [view])

  const views: View[] = [...(c.variant.hasGuide ? (['guide'] as View[]) : []), ...c.variant.tabs.map((_, i) => i)]

  // Стрелки ← → переключают вкладки, как в любом списке вкладок.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const at = views.indexOf(view)
    let next = at
    if (e.key === 'ArrowLeft') next = (at - 1 + views.length) % views.length
    if (e.key === 'ArrowRight') next = (at + 1) % views.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = views.length - 1
    c.selectView(views[next])
    document.getElementById(`tab-${String(views[next])}`)?.focus()
  }

  return (
    <div
      ref={bar}
      className={styles.bar}
      role="tablist"
      aria-label="Вкладки"
      onKeyDown={onKeyDown}
      data-more-left={more.left}
      data-more-right={more.right}
    >
      {c.variant.hasGuide && (
        <button
          type="button"
          role="tab"
          id="tab-guide"
          aria-selected={view === 'guide'}
          aria-controls="work-panel"
          tabIndex={view === 'guide' ? 0 : -1}
          className={`key ${styles.tab} ${styles.guide}`}
          onClick={() => c.selectView('guide')}
        >
          <BookIcon size={15} />
          Гайд
        </button>
      )}
      {c.variant.tabs.map((tab, i) => {
        const badge = badges[i]
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${i}`}
            aria-selected={view === i}
            aria-controls="work-panel"
            tabIndex={view === i ? 0 : -1}
            className={`key ${styles.tab}`}
            data-error={badge === 'error' || undefined}
            onClick={() => c.selectView(i)}
            title={`${tab.title}: ${BADGE_TEXT[badge]}`}
          >
            {tab.step && <span className={styles.num}>{tab.step}</span>}
            {tab.title}
            <span className={styles.badge}>
              {badge === 'engine' ? <SlidersIcon size={13} /> : <BadgeIcon kind={badge} />}
            </span>
            <span className="visually-hidden">, {BADGE_TEXT[badge]}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Вкладки не помещаются: с какой стороны есть ещё — там край полосы тает, видно, что её можно листать. */
function useMore(ref: RefObject<HTMLDivElement | null>) {
  const [more, setMore] = useState({ left: false, right: false })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => {
      const left = el.scrollLeft > 1
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
      setMore((m) => (m.left === left && m.right === right ? m : { left, right }))
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check)
    ro?.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      ro?.disconnect()
    }
  }, [ref])
  return more
}
