import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { runQuestNow } from '@/app/controller.ts'
import { lessonProgress } from '@/core/levels.ts'
import { gameHref, homeHref } from '@/app/routes.ts'
import { CheckIcon, LogoCube, PlayIcon, ResetIcon } from './icons.tsx'
import styles from './Header.module.css'

export function Header() {
  const c = useController()
  const tutorial = c.variant.hasGuide
  const header = useRef<HTMLElement>(null)
  const squeeze = useSqueeze(header)

  return (
    <header ref={header} className={styles.header} data-squeeze={squeeze}>
      <div className={styles.brand}>
        <a className={styles.home} href={homeHref()} title="В главное меню" aria-label="TimeBox — в главное меню">
          <LogoCube className={styles.logo} />
          <span className={styles.name}>TimeBox</span>
        </a>
        {tutorial ? (
          <span className={styles.tagline}>конструктор игр</span>
        ) : (
          <span className={styles.tag}>готовая игра</span>
        )}
      </div>

      {tutorial ? (
        <Checkpoints />
      ) : (
        <a className={`key key--s ${styles.back}`} href={gameHref(c.lesson.id)}>
          Учебная версия
        </a>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className="key key--ghost key--s"
          onClick={() => c.openDialog({ kind: 'resetAll' })}
          aria-label="Сбросить всё"
          title="Сбросить всё"
        >
          <ResetIcon size={13} />
          <span className={styles.wideOnly}>Сбросить всё</span>
        </button>
        <RunButton />
      </div>
    </header>
  )
}

/**
 * Шапка не помещается в окно — сжимаем её по шагам: 1 — прячем подписи чек-поинтов (остаются кружки),
 * 2 — ещё и текст «Сбросить всё» (остаётся значок), 3 — две строки, как на телефоне. Подписи у игр разной
 * длины, поэтому меряем, а не угадываем ширину экрана. Ширину, которая была нужна до сжатия, запоминаем:
 * окно стало шире — разжимаем обратно. Меряем и после загрузки шрифтов: с ними подписи шире.
 */
function useSqueeze(ref: RefObject<HTMLElement | null>): number {
  const [level, setLevel] = useState(0)
  const need = useRef<number[]>([])

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const check = () => {
      if (level < 3 && el.scrollWidth > el.clientWidth + 1) {
        need.current[level] = el.scrollWidth
        setLevel(level + 1)
      } else if (level > 0 && el.clientWidth >= need.current[level - 1]) {
        setLevel(level - 1)
      }
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(el)
    for (const child of el.children) ro.observe(child)
    let alive = true
    document.fonts?.ready.then(() => alive && check())
    return () => {
      alive = false
      ro.disconnect()
    }
  }, [ref, level])

  return level
}

/**
 * «Собрать». Есть несобранные изменения — кнопка подпрыгивает. В квесте «Собери игру» всё вокруг
 * темнеет, а кнопка светится поверх: первый раз ученик должен её найти.
 */
function RunButton() {
  const c = useController()
  const dirty = useApp((s) => s.codes.some((code, i) => code !== s.ran[i]))
  const codes = useApp((s) => s.codes)
  const ran = useApp((s) => s.ran)
  const off = useApp((s) => s.spotOff || s.dialog !== null)
  const quest = useMemo(() => runQuestNow(c, codes, ran), [c, codes, ran])
  const spot = quest !== null && !off
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!spot) return
    button.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') c.dismissSpot()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [spot, c])

  return (
    <span className={styles.runWrap}>
      {spot && <div className={styles.dim} aria-hidden="true" onClick={c.dismissSpot} />}
      <button
        ref={button}
        type="button"
        className={`key key--apple key--l ${styles.run}`}
        data-dirty={dirty && !spot}
        data-spot={spot}
        onClick={c.run}
        aria-keyshortcuts="Control+Enter"
        aria-describedby={spot ? 'run-callout' : undefined}
        title={dirty ? 'Есть изменения — собери игру, чтобы увидеть их' : undefined}
      >
        <PlayIcon size={15} />
        Собрать
        <span className={styles.shortcut} aria-hidden="true">
          Ctrl+Enter
        </span>
        {dirty && !spot && <span className="visually-hidden"> — есть несобранные изменения</span>}
      </button>
      {spot && (
        <div className={styles.callout} id="run-callout" role="status">
          <p>{quest.callout}</p>
          <button type="button" className="key key--s key--ghost" onClick={c.dismissSpot}>
            Позже
          </button>
        </div>
      )}
    </span>
  )
}

/** Чек-поинты: шаги игры (зелёные) и дополнительные задания (жёлтые) в одном ряду. Учитель видит прогресс издалека. */
function Checkpoints() {
  const c = useController()
  const codes = useApp((s) => s.codes)
  const ran = useApp((s) => s.ran)
  const progress = useMemo(() => lessonProgress(c.lesson, codes, ran), [c, codes, ran])
  const points = [
    ...c.lesson.steps.map((step, i) => ({
      key: `step-${step.step}`,
      kind: 'step' as const,
      label: c.variant.tabs[step.tab].title,
      aria: `Шаг ${step.step}, «${c.variant.tabs[step.tab].title}»`,
      target: `guide-step-${step.step}`,
      done: progress.levels[i].done,
    })),
    ...c.lesson.extras.map((x, i) => ({
      key: `extra-${x.n}`,
      kind: 'extra' as const,
      label: x.title,
      aria: `Дополнительно: «${x.title}»`,
      target: `guide-task-${x.n}`,
      done: progress.extras[i].done,
    })),
  ]
  const done = points.map((p) => p.done)
  const count = done.filter(Boolean).length
  const prev = useRef<boolean[] | null>(null)
  const marks = useRef<(HTMLSpanElement | null)[]>([])
  const counter = useRef<HTMLSpanElement | null>(null)
  const doneKey = done.join()

  // Единственная анимация без действия ученика: чек-поинт пройден — галочка подпрыгивает.
  useEffect(() => {
    const now = doneKey.split(',').map((d) => d === 'true')
    const before = prev.current
    prev.current = now
    if (!before) return
    let any = false
    now.forEach((d, i) => {
      if (d && !before[i]) {
        any = true
        marks.current[i]?.classList.add(styles.justDone)
      }
    })
    if (any) counter.current?.classList.add(styles.pop)
  }, [doneKey])

  // под картой открывается эта станция, и гайд прокручивается к ней
  const open = (key: string, id: string) => {
    c.showStation(key)
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30)
  }

  return (
    <nav className={styles.progress} aria-label="Прогресс">
      <ol className={styles.points}>
        {points.map((p, i) => (
          <li key={p.key} data-kind={p.kind}>
            <button
              type="button"
              className={styles.point}
              data-kind={p.kind}
              data-done={p.done}
              onClick={() => open(p.key, p.target)}
              aria-label={`${p.aria}: ${p.done ? 'сделано' : 'не сделано'}`}
            >
              <span
                ref={(el) => {
                  marks.current[i] = el
                }}
                className={styles.mark}
                onAnimationEnd={(e) => e.currentTarget.classList.remove(styles.justDone)}
              >
                {p.done && <CheckIcon size={13} />}
              </span>
              <span className={styles.label}>{p.label}</span>
            </button>
          </li>
        ))}
      </ol>
      <span
        ref={counter}
        className={styles.count}
        onAnimationEnd={(e) => e.currentTarget.classList.remove(styles.pop)}
        aria-live="polite"
      >
        {count}/{points.length}
      </span>
    </nav>
  )
}
