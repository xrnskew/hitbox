import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import type { LevelState, Station, StationState } from '@/core/levels.ts'
import { INK } from '@/core/pictures.ts'
import type { Lesson } from '@/lessons/types.ts'
import { CheckIcon, LockIcon } from './icons.tsx'
import { Pic } from './Pic.tsx'
import styles from './Roadmap.module.css'

// Карта игры над гайдом — как карта уровней в настоящих играх. Дорога петляет от станции к станции: шаги,
// бонусные задания и финиш с подарком. Пройденный кусок дороги жёлтый, текущая станция пульсирует, над ней — стрелка.
// Нажал станцию — под картой открывается она одна. Всё считается по тем же квестам, что и гайд.
// Станция пройдена — один момент награды: она вспыхивает и разбрасывает пиксели, потом жёлтая дорога дотягивается
// до следующей и туда переезжает стрелка. Ученик проходил шаг в коде — момент ждёт, пока он вернётся в «Гайд».

const STATE_TEXT: Record<StationState, string> = {
  done: 'пройдено',
  now: 'ты здесь',
  open: 'открыто',
  locked: 'закрыто',
}

/** Сколько длится вспышка пройденной станции, мс: она сама, пиксели и переезд стрелки. */
const BURST_MS = 1600
/** Пиксели вспышки разлетаются по кругу — направления в градусах. */
const SPARKS = [0, 45, 90, 135, 180, 225, 270, 315]

/** Стрелка «ты здесь» по клеткам: k — контур, y — жёлтая. */
const ARROW = [
  '..kkkkk..',
  '..kyyyk..',
  '..kyyyk..',
  'kkkyyykkk',
  'kyyyyyyyk',
  '.kyyyyyk.',
  '..kyyyk..',
  '...kyk...',
  '....k....',
]

/** Где станция на карте, в процентах: дорога идёт слева направо волной — вверх, вниз, вверх… */
function spot(i: number, count: number) {
  const pad = 9
  return { x: pad + (i * (100 - 2 * pad)) / Math.max(1, count - 1), y: i % 2 ? 34 : 64 }
}

/** Дорога через точки: плавные изгибы, ручки — по горизонтали. */
function road(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`
      const prev = points[i - 1]
      const mid = (p.x - prev.x) / 2
      return `C${prev.x + mid} ${prev.y} ${p.x - mid} ${p.y} ${p.x} ${p.y}`
    })
    .join('')
}

export function Roadmap({
  lesson,
  levels,
  list,
  shown,
}: {
  lesson: Lesson
  levels: LevelState[]
  list: Station[]
  /** Ключ станции, открытой под картой. */
  shown: string
}) {
  const c = useController()
  const visible = useApp((s) => s.view === 'guide')
  const points = list.map((_, i) => spot(i, list.length))
  const atFinish = list.every((s) => s.state === 'done')
  const at = Math.max(
    0,
    list.findIndex((s) => s.state === 'now' || (atFinish && s.kind === 'finish')),
  )

  // Где стоит стрелка и какие станции сейчас вспыхивают. Догоняет прогресс, только когда карту видно.
  const doneKeys = list
    .filter((s) => s.state === 'done')
    .map((s) => s.key)
    .join()
  const seen = useRef(doneKeys)
  const map = useRef<HTMLElement>(null)
  const [moment, setMoment] = useState({ at, burst: [] as string[] })
  useEffect(() => {
    if (!visible) return
    // через кадр: карта, которую только что показали, должна сперва нарисоваться со стрелкой на старом месте
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const before = new Set(seen.current.split(','))
        seen.current = doneKeys
        const fresh = doneKeys ? doneKeys.split(',').filter((k) => !before.has(k)) : []
        setMoment((m) => ({ at, burst: fresh.length ? fresh : m.burst }))
        // ученик вернулся в гайд прокрученным вниз — поднять карту, чтобы момент было видно
        const el = map.current
        if (fresh.length && el && el.getBoundingClientRect().top < 0) {
          const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
        }
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [visible, doneKeys, at])
  useEffect(() => {
    if (!moment.burst.length) return
    const t = setTimeout(() => setMoment((m) => ({ ...m, burst: [] })), BURST_MS)
    return () => clearTimeout(t)
  }, [moment.burst])
  const arrowAt = moment.at

  // на узком экране карта шире окна и листается вбок: текущая станция — посередине
  const land = useRef<HTMLDivElement>(null)
  const atX = points[arrowAt].x
  useEffect(() => {
    const el = land.current
    if (!el || el.scrollWidth <= el.clientWidth) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: (el.scrollWidth * atX) / 100 - el.clientWidth / 2, behavior: calm ? 'auto' : 'smooth' })
  }, [atX])
  const current = list[at]
  const level = current.kind === 'step' ? levels[current.n - 1] : null
  const step = current.kind === 'step' ? lesson.steps[current.n - 1] : null

  return (
    <nav className={styles.map} aria-label="Карта игры" ref={map}>
      <p className={styles.where} aria-live="polite">
        {atFinish ? (
          <>Игра собрана целиком! Ты на финише.</>
        ) : current.kind === 'step' && step && level ? (
          <>
            Ты здесь: шаг {current.n} «{current.title}»
            {level.current >= 0 && (
              <span className={styles.quest}>
                квест {level.current + 1} из {step.quests.length}
              </span>
            )}
          </>
        ) : (
          <>Бонус: «{current.title}». Основная игра уже собрана.</>
        )}
      </p>

      <div className={styles.land} ref={land}>
        <div className={styles.world}>
          <svg className={styles.road} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={road(points)} className={styles.roadBed} vectorEffect="non-scaling-stroke" />
            <path d={road(points)} className={styles.roadTiles} vectorEffect="non-scaling-stroke" />
          </svg>
          {/* пройденная дорога — вся дорога, обрезанная по стрелке: стрелка переехала — дорога дотягивается за ней */}
          <div
            className={styles.doneClip}
            style={{ '--to': `${points[arrowAt].x}%` } as CSSProperties}
            aria-hidden="true"
          >
            <svg className={styles.road} viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d={road(points)} className={styles.roadDone} vectorEffect="non-scaling-stroke" />
            </svg>
          </div>

          <ol className={styles.stations}>
            {list.map((s, i) => (
              <li
                key={s.key}
                className={styles.station}
                data-kind={s.kind}
                data-state={s.state}
                data-row={i % 2 ? 'top' : 'bottom'}
                data-shown={s.key === shown}
                data-burst={moment.burst.includes(s.key) || undefined}
                style={{ '--x': `${points[i].x}%`, '--y': `${points[i].y}%` } as CSSProperties}
              >
                {moment.burst.includes(s.key) && (
                  <span className={styles.sparks} aria-hidden="true">
                    {SPARKS.map((a, j) => (
                      <i
                        key={a}
                        style={{ '--a': `${a}deg`, '--c': j % 2 ? 'var(--leaf)' : 'var(--sun)' } as CSSProperties}
                      />
                    ))}
                  </span>
                )}
                <button
                  type="button"
                  className={styles.pad}
                  onClick={() => c.showStation(s.key)}
                  aria-current={s.state === 'now' ? 'step' : undefined}
                  aria-pressed={s.key === shown}
                  aria-label={`${s.kind === 'step' ? `Шаг ${s.n}: ` : s.kind === 'extra' ? 'Бонус: ' : ''}${s.title} — ${STATE_TEXT[s.state]}`}
                >
                  <Pic name={s.pic} className={styles.padPic} />
                  {s.kind === 'step' && <span className={styles.num}>{s.n}</span>}
                  {s.state === 'done' && (
                    <span className={styles.flag}>
                      <CheckIcon size={11} />
                    </span>
                  )}
                  {s.state === 'locked' && (
                    <span className={styles.flag}>
                      <LockIcon size={10} />
                    </span>
                  )}
                </button>
                <span className={styles.label} aria-hidden="true">
                  {s.title}
                </span>
              </li>
            ))}
          </ol>

          {/* пиксельная стрелка над текущей станцией; станция сменилась — стрелка переезжает туда */}
          <svg
            className={styles.arrow}
            viewBox="0 0 9 9"
            shapeRendering="crispEdges"
            style={{ '--x': `${points[arrowAt].x}%`, '--y': `${points[arrowAt].y}%` } as CSSProperties}
            aria-hidden="true"
          >
            {ARROW.flatMap((row, y) =>
              [...row].map((ch, x) =>
                ch === '.' ? null : (
                  <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={ch === 'k' ? INK : 'var(--sun)'} />
                ),
              ),
            )}
          </svg>
        </div>
      </div>
    </nav>
  )
}
