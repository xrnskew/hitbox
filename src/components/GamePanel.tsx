import { type KeyboardEvent, type MouseEvent, type PointerEvent, useEffect, useRef } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { useStore } from '@/app/store.ts'
import { ResetIcon, TriangleIcon } from './icons.tsx'
import styles from './GamePanel.module.css'

/** Правая колонка: карманная приставка с игрой (корпус своего цвета у каждой игры), под ней «Приборы» и консоль. */
export function GamePanel() {
  const c = useController()

  return (
    <section className={styles.panel} aria-label="Игра">
      <div className={styles.console} data-shell={c.lesson.consoleColor}>
        <div className={styles.bezel}>
          <GameScreen />
          <FocusLed />
        </div>
        <Controls />
      </div>
      <Tools />
      {c.variant.features && (
        <div className={styles.features}>
          <h2>Что тут есть</h2>
          <ul>
            {c.variant.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/** Каждый запуск — новый iframe целиком: старые обработчики и циклы кадров не копятся. */
function GameScreen() {
  const c = useController()
  const runId = useApp((s) => s.runId)
  const doc = useApp((s) => s.doc)
  const focused = useApp((s) => s.gameFocused)
  const game = useApp((s) => s.game)
  const gap = useApp((s) => !!s.error?.gap)
  const { setFrame, onFrameLoad } = c

  return (
    <div className={styles.screen} data-focused={focused} data-game={game}>
      <iframe
        key={runId}
        ref={setFrame}
        srcDoc={doc}
        title={`Игра ${c.lesson.title}`}
        className={styles.iframe}
        onLoad={onFrameLoad}
      />
      {game === 'running' && !focused && (
        <button type="button" className={styles.clickToPlay} onClick={c.focusGame}>
          <span>Нажми, чтобы играть</span>
        </button>
      )}
      {game === 'over' && <GameOver />}
      {game === 'blocked' && (
        <div className={styles.card}>
          <strong>Игра не запустилась</strong>
          <p>
            {gap ? 'В коде пропуск. Выбери вариант и нажми «Собрать».' : 'В коде ошибка. Исправь её и нажми «Собрать».'}
          </p>
          <button type="button" className="key key--sun key--s" onClick={c.showError}>
            {gap ? 'Показать пропуск' : 'Показать ошибку'}
          </button>
        </div>
      )}
      {game === 'stopped' && (
        <div className={styles.bottomCard}>
          <p>Игра остановилась из-за ошибки.</p>
          <button type="button" className="key key--sun key--s" onClick={c.showError}>
            Показать
          </button>
        </div>
      )}
    </div>
  )
}

function GameOver() {
  const c = useController()
  const score = useApp((s) => s.lastScore)
  const best = useApp((s) => s.best)
  const ref = useRef<HTMLButtonElement>(null)
  // Enter сразу после проигрыша — «Начать заново».
  useEffect(() => ref.current?.focus(), [])
  // карточка посередине экрана закрывает надпись «Игра окончена» с холста и повторяет её
  return (
    <div className={styles.card}>
      <strong>Игра окончена</strong>
      <p>
        Счёт: <b>{score}</b>. Рекорд: <b>{best}</b>.
      </p>
      <button ref={ref} type="button" className="key key--apple" onClick={c.run}>
        <ResetIcon size={14} />
        Начать заново
      </button>
    </div>
  )
}

/** Лампочка на рамке экрана: горит, когда игра слушает клавиши. */
function FocusLed() {
  const c = useController()
  const focused = useApp((s) => s.gameFocused)
  const keys = c.lesson.controls.keysHint
  return (
    <p className={styles.led} data-on={focused} aria-live="polite">
      <span className={styles.ledDot} aria-hidden="true" />
      {focused ? `Играем: жми ${keys}` : `Нажми на экран, потом жми ${keys}`}
    </p>
  )
}

/** Кнопки на корпусе — у каждой игры свои (Корзинка: ← →, Птичка: «Взмах», Космос: ← → и «Огонь»), и мышью, и пальцем; тумблер — «Границы». */
function Controls() {
  const c = useController()
  const hitboxes = useApp((s) => s.hitboxes)
  const game = useApp((s) => s.game)
  const { buttons } = c.lesson.controls

  // Фокус остаётся у игры: иначе кнопка забирает его, и поверх экрана всплывает «Нажми, чтобы играть».
  const hold = (k: string) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {
        // без захвата тоже работает
      }
      c.focusGame()
      c.pressKey(k, true)
    },
    onPointerUp: () => c.pressKey(k, false),
    onPointerCancel: () => c.pressKey(k, false),
    // mousedown (и тот, что браузер шлёт после касания) переносит фокус на кнопку — не даём
    onMouseDown: (e: MouseEvent) => e.preventDefault(),
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
  })

  return (
    <div className={styles.controls}>
      <div className={styles.dpad} role="group" aria-label="Кнопки игры">
        {buttons.map((b) => (
          <button
            key={b.key}
            type="button"
            className={styles.arrow}
            data-wide={b.wide === true}
            aria-label={b.label}
            // с клавиатуры играют настоящими клавишами: кнопки корпуса — для мыши и пальца, Tab их пропускает
            tabIndex={-1}
            {...hold(b.key)}
          >
            <TriangleIcon dir={b.icon} />
            {b.wide && <span className={styles.arrowLabel}>{b.label}</span>}
          </button>
        ))}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={hitboxes}
        className={styles.switch}
        onClick={c.toggleHitboxes}
        disabled={game === 'blocked'}
        title={c.lesson.controls.hitboxes}
      >
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
        Границы
      </button>

      <span className={styles.grille} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  )
}

function Tools() {
  const c = useController()
  const panel = useApp((s) => s.panel)
  const unread = useApp((s) => s.unreadLogs)
  // стрелки ← → переключают «Приборы» и «Консоль», как вкладки над кодом
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const next =
      e.key === 'Home' ? 'inspector' : e.key === 'End' ? 'console' : panel === 'inspector' ? 'console' : 'inspector'
    c.setPanel(next)
    document.getElementById(`tool-${next}`)?.focus()
  }
  return (
    <div className={styles.tools}>
      <div className={styles.toolTabs} role="tablist" aria-label="Инструменты" onKeyDown={onKeyDown}>
        <button
          type="button"
          role="tab"
          id="tool-inspector"
          aria-selected={panel === 'inspector'}
          tabIndex={panel === 'inspector' ? 0 : -1}
          aria-controls="tool-panel"
          onClick={() => c.setPanel('inspector')}
        >
          Приборы
        </button>
        <button
          type="button"
          role="tab"
          id="tool-console"
          aria-selected={panel === 'console'}
          tabIndex={panel === 'console' ? 0 : -1}
          aria-controls="tool-panel"
          onClick={() => c.setPanel('console')}
        >
          Консоль
          {unread > 0 && <span className={styles.unread}>{unread}</span>}
        </button>
      </div>
      <div id="tool-panel" role="tabpanel" aria-labelledby={`tool-${panel}`} className={styles.toolBody}>
        {panel === 'inspector' ? <Inspector /> : <Console />}
      </div>
    </div>
  )
}

function Inspector() {
  const c = useController()
  const values = useStore(c.inspector, (s) => s.values)
  const hints = new Map(c.lesson.hints.globals.map((h) => [h.name, h.text]))
  return (
    <dl className={styles.inspector}>
      {c.lesson.hints.watch.map((name) => (
        <div key={name} title={hints.get(name)}>
          <dt>{name}</dt>
          <dd>{values[name] ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

function Console() {
  const c = useController()
  const entries = useStore(c.logs, (s) => s.entries)
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const el = list.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  if (!entries.length)
    return (
      <p className={styles.empty}>
        Здесь появится всё, что ты выведешь через <code className="inline-code">console.log(...)</code>.
      </p>
    )
  return (
    <>
      <ol ref={list} className={styles.logList}>
        {entries.map((e) => (
          <li key={e.id} data-level={e.level}>
            <span>{e.text}</span>
            {e.count > 1 && <span className={styles.count}>×{e.count}</span>}
          </li>
        ))}
      </ol>
      <button type="button" className={`key key--s ${styles.clear}`} onClick={c.clearLogs}>
        Очистить
      </button>
    </>
  )
}
