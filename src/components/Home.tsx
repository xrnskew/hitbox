import { type CSSProperties, type ReactNode, useMemo } from 'react'
import { lessonProgress } from '@/core/levels.ts'
import { gameHref } from '@/app/routes.ts'
import { LESSONS } from '@/lessons/index.ts'
import { chosenPic } from '@/lessons/kit.ts'
import type { Lesson } from '@/lessons/types.ts'
import { loadCodes } from '@/sandbox/storage.ts'
import { CheckIcon, LockIcon, LogoCube, PlayIcon } from './icons.tsx'
import { Pic } from './Pic.tsx'
import styles from './Home.module.css'

// Главное меню: выбор игры. Каждая игра — карточка с маленькой приставкой, на экране которой
// игра идёт сама; прогресс берётся из сохранения этой игры в браузере.

export function Home() {
  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <LogoCube className={styles.logo} />
        <span className={styles.name}>HitBox</span>
        <span className={styles.tagline}>конструктор игр</span>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Выбери игру</h1>
        <p className={styles.lead}>
          Игра собирается по квестам: добавляешь кусочек кода, жмёшь «Собрать» — и сразу видишь, что получилось.
        </p>

        <ul className={styles.games} aria-label="Игры">
          {LESSONS.map((lesson) => (
            <li key={lesson.id}>
              <GameCard lesson={lesson} />
            </li>
          ))}
          <li className={styles.soon} aria-label="Скоро">
            <LockIcon size={22} />
            <p>Здесь появятся новые игры</p>
          </li>
        </ul>

        <p className={styles.note}>Прогресс каждой игры сохраняется в этом браузере.</p>
      </main>
    </div>
  )
}

interface Progress {
  started: boolean
  marks: { kind: 'step' | 'extra'; done: boolean }[]
  hero: string
  item: string | null
}

function progressOf(lesson: Lesson): Progress {
  const v = lesson.tutorial
  const codes = loadCodes(v.storageKey, v.tabs.length) ?? v.initial
  const { levels, extras } = lessonProgress(lesson, codes)
  return {
    started: codes.some((c, i) => c !== v.initial[i]),
    marks: [
      ...levels.map((l) => ({ kind: 'step' as const, done: l.done })),
      ...extras.map((x) => ({ kind: 'extra' as const, done: x.done })),
    ],
    hero: chosenPic(codes, lesson.card.heroVar) ?? lesson.card.hero,
    item: (lesson.card.itemVar && chosenPic(codes, lesson.card.itemVar)) ?? lesson.card.item ?? null,
  }
}

function GameCard({ lesson }: { lesson: Lesson }) {
  const p = useMemo(() => progressOf(lesson), [lesson])
  const done = p.marks.filter((m) => m.done).length
  const all = done === p.marks.length
  const id = `game-${lesson.id}`

  return (
    <article className={styles.card} aria-labelledby={id}>
      {lesson.card.scene === 'bird' ? (
        <BirdAttract color={lesson.consoleColor} bird={p.hero} />
      ) : lesson.card.scene === 'space' ? (
        <SpaceAttract color={lesson.consoleColor} ship={p.hero} alien={p.item ?? 'пришелец'} />
      ) : (
        <Attract color={lesson.consoleColor} hero={p.hero} item={p.item ?? 'яблоко'} />
      )}
      <div className={styles.info}>
        <h2 id={id}>{lesson.title}</h2>
        <p className={styles.level} data-shell={lesson.consoleColor}>
          <span className={styles.bars} aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} data-on={i < lesson.card.levelBars} />
            ))}
          </span>
          {lesson.card.level}
        </p>
        <p className={styles.blurb}>{lesson.card.blurb}</p>

        <div className={styles.progress}>
          <ol className={styles.marks} aria-hidden="true">
            {p.marks.map((m, i) => (
              <li key={i} data-kind={m.kind} data-done={m.done}>
                {m.done && <CheckIcon size={11} />}
              </li>
            ))}
          </ol>
          <span>
            {done === 0
              ? p.started
                ? 'Начата'
                : 'Ещё не начата'
              : all
                ? 'Пройдена целиком'
                : `Пройдено ${done} из ${p.marks.length}`}
          </span>
        </div>

        <a className={`key key--apple key--l ${styles.play}`} href={gameHref(lesson.id)}>
          <PlayIcon size={15} />
          {p.started ? 'Продолжить' : 'Начать'}
          <span className="visually-hidden"> {lesson.title}</span>
        </a>
      </div>
    </article>
  )
}

/** Маленькая приставка: экран и кнопки под ним. */
function Mini({ color, scene, pad, children }: { color: string; scene: string; pad: number; children: ReactNode }) {
  return (
    <div className={styles.console} data-shell={color} aria-hidden="true">
      <div className={styles.bezel}>
        <div className={styles.screen} data-scene={scene}>
          {children}
        </div>
      </div>
      <div className={styles.pad} data-pad={pad}>
        {Array.from({ length: pad }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    </div>
  )
}

/** Корзинка: игра идёт сама — яблоки падают, герой успевает под каждое. */
function Attract({ color, hero, item }: { color: string; hero: string; item: string }) {
  return (
    <Mini color={color} scene="catch" pad={2}>
      {[22, 72, 45].map((x, i) => (
        <span key={i} className={styles.item} style={{ '--x': `${x}%`, '--i': i } as CSSProperties}>
          <Pic name={item} />
        </span>
      ))}
      <span className={styles.hero}>
        <Pic name={hero} />
      </span>
    </Mini>
  )
}

/** Птичка: трубы едут навстречу, птица подпрыгивает и пролетает в каждую дырку. */
function BirdAttract({ color, bird }: { color: string; bird: string }) {
  return (
    <Mini color={color} scene="bird" pad={1}>
      {[24, 30].map((top, i) => (
        <span key={i} className={styles.pipe} style={{ '--top': `${top}%`, '--i': i } as CSSProperties}>
          <span className={styles.pipeTop} />
          <span className={styles.pipeBottom} />
        </span>
      ))}
      <span className={styles.bird}>
        <Pic name={bird} />
      </span>
    </Mini>
  )
}

/**
 * Космос: пришельцы входят сверху по одному и спускаются зигзагом, корабль подъезжает под каждого,
 * пуля летит вверх, и пришелец лопается.
 */
function SpaceAttract({ color, ship, alien }: { color: string; ship: string; alien: string }) {
  return (
    <Mini color={color} scene="space" pad={3}>
      <span className={styles.moon}>
        <Pic name="луна" />
      </span>
      {[22, 50, 78].map((x, i) => (
        <span key={i} style={{ '--x': `${x}%`, '--i': i } as CSSProperties}>
          <span className={styles.shot} />
          <span className={styles.alien}>
            <Pic name={alien} />
          </span>
          <span className={styles.boom}>
            <Pic name="взрыв" />
          </span>
        </span>
      ))}
      <span className={styles.ship}>
        <Pic name={ship} />
      </span>
    </Mini>
  )
}
