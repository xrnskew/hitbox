import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { homeHref } from '@/app/routes.ts'
import {
  type ExtraState,
  hereStation,
  type LevelState,
  lessonProgress,
  type Station,
  stationList,
} from '@/core/levels.ts'
import { type FnState, stepStates } from '@/core/progress.ts'
import { chosenPic } from '@/lessons/kit.ts'
import type { BuildTask, EditTask, GuideExtra, GuideStep, RunTask, StepTask } from '@/lessons/types.ts'
import { CodeBlock } from './CodeBlock.tsx'
import {
  BulbIcon,
  CheckIcon,
  CodeIcon,
  FaceIcon,
  HelpIcon,
  LockIcon,
  PaletteIcon,
  PlayIcon,
  TargetIcon,
  TriangleIcon,
} from './icons.tsx'
import { Pic } from './Pic.tsx'
import { Rich } from './Rich.tsx'
import { Roadmap } from './Roadmap.tsx'
import styles from './Guide.module.css'

// Гайд заменяет презентацию: ученик идёт в своём темпе. Шаг — цепочка квестов: код собирается
// кнопками «Добавить» по кусочкам прямо во вкладке. Следующий шаг открывается, когда выполнены все
// квесты. Под картой — одна станция: та, где ученик сейчас, или та, что он выбрал на карте; остальные
// скрыты, но не размонтируются (помнят раскрытые «Готовый код» и подсказки). Гайд тоже не размонтируется.
export function Guide() {
  const c = useController()
  const codes = useApp((s) => s.codes)
  const ran = useApp((s) => s.ran)
  const picked = useApp((s) => s.station)
  const { lesson } = c
  const progress = useMemo(() => lessonProgress(lesson, codes, ran), [lesson, codes, ran])
  const { levels, extras, allDone } = progress
  const list = useMemo(() => stationList(lesson, progress), [lesson, progress])
  const here = hereStation(list).key
  // выбор живёт, пока ученик на той же станции; ушёл дальше — показываем, где он теперь
  const choice = picked && picked.at === here ? list.findIndex((s) => s.key === picked.key) : -1
  const index = choice >= 0 ? choice : list.findIndex((s) => s.key === here)
  const station = list[index]
  /** Уровень цепочки пройден, а ученик вернулся к нему — кнопка к следующей станции. */
  const nextAfter = (i: number): Next | null => {
    const all = [...levels, ...extras]
    if (!all[i]?.done) return null
    const s = list[i + 1]
    if (!s) return null
    if (s.kind === 'step') return { key: s.key, open: `Шаг ${s.n} открыт.`, go: `Перейти к шагу ${s.n}` }
    if (s.kind === 'extra') return { key: s.key, open: `Бонус «${s.title}» открыт.`, go: 'Перейти к бонусу' }
    return all.every((l) => l.done) ? { key: s.key, open: 'Финиш открыт.', go: 'Перейти к финишу' } : null
  }

  // сменилась станция, а начало гайда выше экрана (нажали «Дальше» внизу) — подняться к карте
  const top = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const el = top.current
    if (!el || el.getBoundingClientRect().top >= 0) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  }, [station.key])

  return (
    <article className={styles.guide}>
      <header className={styles.hero}>
        <h1>{lesson.intro.title}</h1>
        <p className={styles.lead}>
          <Rich text={lesson.intro.lead} />
        </p>
        <ul className={styles.tips}>
          {lesson.intro.tips.map((t) => (
            <li key={t}>
              <Rich text={t} />
            </li>
          ))}
        </ul>
      </header>

      <div ref={top} className={styles.stage}>
        <Roadmap lesson={lesson} levels={levels} list={list} shown={station.key} />
      </div>

      <ol className={styles.track} aria-label="Шаги" hidden={station.kind !== 'step'}>
        {lesson.steps.map((step, i) => (
          <StepItem
            key={step.step}
            index={i}
            step={step}
            total={lesson.steps.length}
            level={levels[i]}
            codes={codes}
            next={nextAfter(i)}
            hidden={station.key !== `step-${step.step}`}
          />
        ))}
      </ol>

      <section className={styles.section} aria-labelledby="guide-extras" hidden={station.kind !== 'extra'}>
        <h2 id="guide-extras">{lesson.extrasTitle}</h2>
        <p className={styles.sub}>
          {allDone
            ? 'Квесты по одному, как в шагах: код встаёт кусочками прямо во вкладках.'
            : 'Сначала собери игру: пройди все шаги вместе с квестами — тогда откроются.'}
        </p>
        <div className={styles.extras}>
          {lesson.extras.map((x, i) => (
            <Extra
              key={x.n}
              index={i}
              chainIndex={lesson.steps.length + i}
              extra={x}
              state={extras[i]}
              codes={codes}
              next={nextAfter(lesson.steps.length + i)}
              hidden={station.key !== `extra-${x.n}`}
            />
          ))}
        </div>
      </section>

      {station.kind === 'finish' && <Finish list={list} done={station.state === 'done'} />}

      <StationNav prev={list[index - 1]} next={list[index + 1]} />

      {/* на открытом финише эта кнопка — на самом экране финиша */}
      <footer
        id="guide-finish"
        className={styles.footer}
        hidden={station.kind === 'finish' && station.state === 'done'}
      >
        <button type="button" className="key key--l" onClick={() => c.openDialog({ kind: 'unlock' })}>
          <LockIcon size={16} />
          Открыть готовую игру
        </button>
        <span>Под паролем.</span>
      </footer>
    </article>
  )
}

/** Числительное: 1 шаг, 3 шага, 5 шагов. */
function plural(n: number, one: string, few: string, many: string) {
  const d = n % 10
  const dd = n % 100
  if (d === 1 && dd !== 11) return one
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few
  return many
}

/**
 * Финиш. Открыт — герой ученика на пьедестале, полка с пройденными станциями и что дальше:
 * собрать и играть, сравнить с готовой версией, выбрать другую игру. Закрыт — что ещё осталось пройти.
 */
function Finish({ list, done }: { list: Station[]; done: boolean }) {
  const c = useController()
  const codes = useApp((s) => s.codes)
  const { lesson } = c
  const earned = list.filter((s) => s.kind !== 'finish')
  const left = earned.filter((s) => s.state !== 'done')
  const steps = lesson.steps.length
  const extras = lesson.extras.length
  const hero = chosenPic(codes, lesson.card.heroVar) ?? lesson.card.hero
  const name = (s: Station) => (s.kind === 'step' ? `Шаг ${s.n}. ${s.title}` : `Бонус: ${s.title}`)

  if (!done)
    return (
      <section className={styles.section} aria-labelledby="guide-finish-title">
        <h2 id="guide-finish-title">Финиш</h2>
        <p className={styles.sub}>Откроется, когда пройдёшь все шаги и бонусы. Осталось:</p>
        <ul className={styles.left} aria-label="Что осталось">
          {left.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                className={`key key--l key--ghost ${styles.leftKey}`}
                data-state={s.state}
                onClick={() => c.showStation(s.key)}
              >
                <Pic name={s.pic} className={styles.leftPic} />
                <span>{name(s)}</span>
                {s.state === 'locked' ? (
                  <LockIcon size={13} />
                ) : (
                  <span className={styles.leftNow}>{s.state === 'now' ? 'ты здесь' : 'открыто'}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>
    )

  return (
    <section className={styles.finish} aria-labelledby="guide-finish-title">
      <div className={styles.podium}>
        <span className={styles.plinth} aria-hidden="true">
          <Pic name={hero} className={styles.heroPic} />
        </span>
        <div className={styles.finishText}>
          <h2 id="guide-finish-title">Игра собрана</h2>
          <p>
            «{lesson.title}» готова целиком: {steps} {plural(steps, 'шаг', 'шага', 'шагов')} и {extras}{' '}
            {plural(extras, 'бонус', 'бонуса', 'бонусов')}. Собери и сыграй — это твоя версия.
          </p>
        </div>
      </div>

      <ul className={styles.shelf} aria-label="Пройдено">
        {earned.map((s) => (
          <li key={s.key} className={styles.medal} data-kind={s.kind} title={name(s)}>
            <Pic name={s.pic} className={styles.medalPic} />
            <span className="visually-hidden">{name(s)} — пройдено</span>
            <CheckIcon size={11} className={styles.medalCheck} />
          </li>
        ))}
      </ul>

      <div className={styles.finishKeys}>
        <button type="button" className="key key--apple key--l" onClick={c.run}>
          <PlayIcon size={15} />
          Собрать и играть
        </button>
        <button type="button" className="key key--l" onClick={() => c.openDialog({ kind: 'unlock' })}>
          <LockIcon size={16} />
          Открыть готовую игру
        </button>
        <a className="key key--l key--ghost" href={homeHref()}>
          Другие игры
        </a>
      </div>
      <p className={styles.finishNote}>Готовая версия — под паролем: сравни её со своей.</p>
    </section>
  )
}

/** Соседние станции внизу: дочитал шаг — не надо листать обратно к карте. */
function StationNav({ prev, next }: { prev?: Station; next?: Station }) {
  const c = useController()
  const name = (s: Station) => (s.kind === 'step' ? `Шаг ${s.n}. ${s.title}` : s.title)
  const key = (s: Station, dir: 'prev' | 'next') => (
    <button
      type="button"
      className={`key key--l key--ghost ${styles.near}`}
      data-dir={dir}
      onClick={() => c.showStation(s.key)}
    >
      {dir === 'prev' && <TriangleIcon dir="left" size={12} />}
      <Pic name={s.pic} className={styles.nearPic} />
      <span className={styles.nearText}>
        <span className={styles.nearDir}>{dir === 'prev' ? 'Назад' : 'Дальше'}</span>
        <span>{name(s)}</span>
      </span>
      {s.state === 'locked' && <LockIcon size={13} />}
      {dir === 'next' && <TriangleIcon dir="right" size={12} />}
    </button>
  )
  return (
    <nav className={styles.nav} aria-label="Соседние станции">
      {prev && key(prev, 'prev')}
      {next && key(next, 'next')}
    </nav>
  )
}

const FN_TEXT: Record<FnState, string> = {
  ok: 'есть, внутри есть код',
  empty: 'есть, но внутри пусто',
  missing: 'функции пока нет',
}

const StepItem = memo(function StepItem({
  index,
  step,
  total,
  level,
  codes,
  next,
  hidden,
}: {
  index: number
  step: GuideStep
  total: number
  level: LevelState
  codes: string[]
  next: Next | null
  hidden: boolean
}) {
  const c = useController()
  const [showCode, setShowCode] = useState(false)
  const [showHow, setShowHow] = useState(false)
  const tabTitle = c.variant.tabs[step.tab].title
  const states = stepStates(codes[step.tab], step.fns)
  const id = `guide-step-${step.step}`
  const state = !level.unlocked ? 'locked' : level.done ? 'done' : 'active'

  return (
    <li id={id} className={styles.step} data-state={state} hidden={hidden}>
      <span className={styles.node} aria-hidden="true">
        {state === 'done' ? <CheckIcon size={22} /> : state === 'locked' ? <LockIcon size={18} /> : step.step}
      </span>
      <div className={styles.stepBody}>
        <div className={styles.stepHead}>
          <h2>
            <span className="visually-hidden">
              Шаг {step.step} из {total}.{' '}
            </span>
            {step.title}
          </h2>
          {state === 'done' && (
            <span className="chip chip--ok">
              <CheckIcon size={12} />
              Сделано
            </span>
          )}
          {state === 'active' && level.current >= 0 && (
            <span className="chip chip--todo">
              Квест {level.current + 1} из {step.quests.length}
            </span>
          )}
          {state === 'locked' && (
            <span className="chip chip--todo">
              <LockIcon size={11} />
              Закрыто
            </span>
          )}
        </div>
        <p className={styles.stepLead}>
          <Rich text={step.lead} />
        </p>

        {state === 'locked' ? (
          <p className={styles.lockedText}>Откроется, когда выполнишь квесты шага {step.step - 1}.</p>
        ) : (
          <>
            <ul className={styles.fns} aria-label={`Что должно быть во вкладке «${tabTitle}»`}>
              {states.map((s) => (
                <li key={s.name} data-state={s.state} title={`${s.name} — ${FN_TEXT[s.state]}`}>
                  {s.state === 'ok' ? <CheckIcon size={12} /> : <span className={styles.dot} aria-hidden="true" />}
                  <code>{s.name}</code>
                  <span className="visually-hidden"> — {FN_TEXT[s.state]}</span>
                </li>
              ))}
            </ul>

            <QuestList chainIndex={index} quests={step.quests} level={level} codes={codes} next={next} />

            <div className={styles.actions}>
              <button
                type="button"
                className="key key--l key--ghost"
                aria-expanded={showCode}
                onClick={() => setShowCode(!showCode)}
              >
                <CodeIcon size={16} />
                {showCode ? 'Скрыть готовый код' : 'Готовый код'}
              </button>
              <button
                type="button"
                className="key key--l key--ghost"
                aria-expanded={showHow}
                onClick={() => setShowHow(!showHow)}
              >
                <HelpIcon size={16} />
                Как это работает
              </button>
            </div>

            {showHow && (
              <ul className={styles.how}>
                {step.how.map((t, i) => (
                  <li key={i}>
                    <Rich text={t} />
                  </li>
                ))}
              </ul>
            )}
            {showCode && (
              <div className={styles.code}>
                <CodeBlock code={step.code} />
                <p className={styles.aside}>
                  Так будет выглядеть «{tabTitle}», когда соберёшь все кусочки. Можно перепечатать руками — так лучше
                  запомнится.
                </p>
              </div>
            )}

            {level.done && (
              <ul className={styles.checks} aria-label="Проверь">
                {step.checks.map((t, i) => (
                  <li key={i}>
                    <Rich text={t} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </li>
  )
})

/** Квест шага: «собери по кусочкам», «поправь сам» или «нажми «Собрать»». */
function TaskBox({
  stepIndex,
  taskIndex,
  task,
  count,
  done,
  code,
  next,
}: {
  stepIndex: number
  taskIndex: number
  task: StepTask
  count: number
  done: boolean
  code: string
  /** Станция, которая открылась после этого квеста. */
  next: Next | null
}) {
  return (
    <section className={styles.task} data-done={done} aria-label={`Квест: ${task.title}`}>
      <div className={styles.taskHead}>
        <span className={styles.taskLabel}>
          Квест {taskIndex + 1} из {count}
        </span>
        <h3>{task.title}</h3>
        {done && (
          <span className="chip chip--ok">
            <CheckIcon size={12} />
            Выполнено
          </span>
        )}
      </div>
      <p className={styles.taskText}>
        <Rich text={task.text} />
      </p>
      {task.kind === 'edit' && <EditTaskBody stepIndex={stepIndex} taskIndex={taskIndex} task={task} done={done} />}
      {task.kind === 'build' && <BuildTaskBody stepIndex={stepIndex} taskIndex={taskIndex} task={task} code={code} />}
      {task.kind === 'run' && <RunTaskBody task={task} done={done} />}
      {next && <NextStep next={next} />}
    </section>
  )
}

/** Станция после пройденного уровня: шаг, бонус или финиш. */
interface Next {
  key: string
  /** «Шаг 2 открыт.», «Бонус «Бомба» открыт.» */
  open: string
  /** Подпись кнопки: «Перейти к шагу 2». */
  go: string
}

/**
 * Квесты уровня по одному: выполненные свёрнуты в строку, текущий раскрыт, следующие скрыты.
 * `chainIndex` — номер уровня в цепочке квестов: шаги, за ними бонусы.
 */
function QuestList({
  chainIndex,
  quests,
  level,
  codes,
  next,
}: {
  chainIndex: number
  quests: StepTask[]
  level: LevelState
  codes: string[]
  next: Next | null
}) {
  return (
    <ol className={styles.quests} aria-label="Квесты">
      {quests.map((task, j) =>
        level.questsDone.slice(0, j).every(Boolean) ? (
          level.questsDone[j] && j !== quests.length - 1 ? (
            <li key={j} className={styles.questDone}>
              <CheckIcon size={13} />
              <span>{task.title}</span>
              <span className="visually-hidden"> — выполнено</span>
            </li>
          ) : (
            <li key={j}>
              <TaskBox
                stepIndex={chainIndex}
                taskIndex={j}
                task={task}
                count={quests.length}
                done={level.questsDone[j]}
                code={codes[task.tab]}
                next={level.done ? next : null}
              />
            </li>
          )
        ) : null,
      )}
    </ol>
  )
}

/** Уровень пройден, а ученик вернулся к нему на карте — кнопка к следующей станции. */
function NextStep({ next }: { next: Next }) {
  const c = useController()
  return (
    <p className={styles.unlocked}>
      {next.open}
      <button type="button" className="key key--s" onClick={() => c.showStation(next.key)}>
        {next.go}
      </button>
    </p>
  )
}

function EditTaskBody({
  stepIndex,
  taskIndex,
  task,
  done,
}: {
  stepIndex: number
  taskIndex: number
  task: EditTask
  done: boolean
}) {
  const c = useController()
  const [hint, setHint] = useState(false)
  const tabTitle = c.variant.tabs[task.tab].title
  return (
    <>
      <div className={styles.actions}>
        <button
          type="button"
          className={done ? 'key key--l' : 'key key--sun key--l'}
          onClick={() => c.openTask(stepIndex, taskIndex)}
        >
          {task.picker === 'pic' ? (
            <FaceIcon size={16} />
          ) : task.picker === 'color' ? (
            <PaletteIcon size={16} />
          ) : (
            <TargetIcon size={15} />
          )}
          {task.picker === 'pic'
            ? `Выбрать картинку в «${tabTitle}»`
            : task.picker === 'color'
              ? `Выбрать цвет в «${tabTitle}»`
              : `Открыть «${tabTitle}»`}
        </button>
        <button type="button" className="key key--l key--ghost" aria-expanded={hint} onClick={() => setHint(!hint)}>
          <BulbIcon size={15} />
          {hint ? 'Скрыть подсказку' : 'Подсказка'}
        </button>
      </div>
      {hint && (
        <div className={styles.hint}>
          {task.hint.map((p, i) => (
            <p key={i}>
              <Rich text={p} />
            </p>
          ))}
        </div>
      )}
    </>
  )
}

/** Кнопки «Добавить» всплывают в самом коде вкладки; здесь — только какие части уже на месте. */
function BuildTaskBody({
  stepIndex,
  taskIndex,
  task,
  code,
}: {
  stepIndex: number
  taskIndex: number
  task: BuildTask
  code: string
}) {
  const c = useController()
  const done = task.pieces.map((p) => p.isDone(code))
  const all = done.every(Boolean)
  const next = done.indexOf(false)
  return (
    <>
      <ol className={styles.pieces} aria-label="Части функции">
        {task.pieces.map((piece, j) => {
          const state = done[j] ? 'done' : j === next ? 'next' : 'wait'
          return (
            <li key={j} className={styles.piece} data-state={state}>
              <span className={styles.partNode} aria-hidden="true">
                {done[j] ? <CheckIcon size={13} /> : j + 1}
              </span>
              <span className={styles.partTitle}>{piece.title}</span>
              <span className="visually-hidden">{done[j] ? ' — на месте' : ' — ещё нет'}</span>
            </li>
          )
        })}
      </ol>
      <div className={styles.actions}>
        <button
          type="button"
          className={all ? 'key key--l' : 'key key--sun key--l'}
          onClick={() => c.openTask(stepIndex, taskIndex)}
        >
          <TargetIcon size={15} />
          Открыть «{c.variant.tabs[task.tab].title}»
        </button>
      </div>
    </>
  )
}

/** «Нажми «Собрать»»: та же кнопка, что в шапке. */
function RunTaskBody({ task, done }: { task: RunTask; done: boolean }) {
  const c = useController()
  return (
    <div className={styles.actions}>
      <button type="button" className={done ? 'key key--l' : 'key key--apple key--l'} onClick={c.run}>
        <PlayIcon size={15} />
        Собрать
      </button>
      {!done && <span className={styles.aside}>{task.callout}</span>}
    </div>
  )
}

/** Бонус: как шаг — квесты по одному, код встаёт кусочками прямо во вкладках. */
const Extra = memo(function Extra({
  index,
  chainIndex,
  extra,
  state,
  codes,
  next,
  hidden,
}: {
  index: number
  chainIndex: number
  extra: GuideExtra
  state: ExtraState
  codes: string[]
  next: Next | null
  hidden: boolean
}) {
  const c = useController()
  const locked = !state.unlocked
  const prev = c.lesson.extras[index - 1]

  return (
    <div
      className={styles.extra}
      id={`guide-task-${extra.n}`}
      data-locked={locked}
      data-done={state.done}
      hidden={hidden}
    >
      <div className={styles.extraHead}>
        <span className={styles.badge} aria-hidden="true">
          {locked ? <LockIcon size={22} /> : <Pic name={extra.pic} />}
        </span>
        <div>
          <h3>
            <span className="visually-hidden">Задание {extra.n}. </span>
            {extra.title}
          </h3>
          <p>
            <Rich text={extra.text} />
          </p>
        </div>
        {state.done ? (
          <span className={`chip chip--ok ${styles.extraChip}`}>
            <CheckIcon size={12} />
            Готово
          </span>
        ) : locked ? (
          <span className={`chip chip--todo ${styles.extraChip}`}>
            <LockIcon size={11} />
            Закрыто
          </span>
        ) : (
          state.current >= 0 && (
            <span className={`chip chip--todo ${styles.extraChip}`}>
              Квест {state.current + 1} из {extra.quests.length}
            </span>
          )
        )}
      </div>

      {locked ? (
        <p className={styles.lockedText}>
          {prev ? `Откроется после «${prev.title}».` : 'Откроется, когда соберёшь игру: все шаги вместе с квестами.'}
        </p>
      ) : (
        <QuestList chainIndex={chainIndex} quests={extra.quests} level={state} codes={codes} next={next} />
      )}
    </div>
  )
})
