import { type CSSProperties, type ReactNode, useMemo } from 'react'
import { hereStation, lessonProgress, stationList } from '@/core/levels.ts'
import { gameHref } from '@/app/routes.ts'
import { LESSONS } from '@/lessons/index.ts'
import { chosenPic } from '@/lessons/kit.ts'
import type { Lesson } from '@/lessons/types.ts'
import { loadLastGame, loadVariantCodes } from '@/sandbox/storage.ts'
import { CheckIcon, LogoCube, PlayIcon } from './icons.tsx'
import { Pic } from './Pic.tsx'
import { WipeAll } from './WipeAll.tsx'
import styles from './Home.module.css'

// Главное меню: выбор игры. Каждая игра — карточка с маленькой приставкой, на экране которой
// игра идёт сама; прогресс берётся из сохранения этой игры в браузере. Красная клавиша на виду одна:
// «Продолжить» у игры, которую ученик открывал последней (и ещё не прошёл), а новичку — «Начать» у первой.
// Игры стоят по сложности: белая, зелёная, красная.

export function Home() {
  const progress = useMemo(() => LESSONS.map(progressOf), [])
  const main = mainGame(progress)
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
          Игра собирается по квестам: добавляешь кусочек кода, жмёшь «Собрать» — и сразу видишь, что получилось. Игры
          идут от лёгкой к сложной — начни с первой.
        </p>

        <ul className={styles.games} aria-label="Игры">
          {LESSONS.map((lesson, i) => (
            <li key={lesson.id}>
              <GameCard lesson={lesson} p={progress[i]} main={i === main} />
            </li>
          ))}
        </ul>

        <footer className={styles.footer}>
          <p className={styles.note}>Прогресс каждой игры сохраняется в этом браузере.</p>
          <WipeAll />
        </footer>
      </main>
    </div>
  )
}

interface Progress {
  started: boolean
  /** Пройдено всё: шаги и бонусы. */
  done: boolean
  /** Где ученик сейчас: станция карты гайда. */
  here: { title: string; pic: string; label: string }
  hero: string
  item: string | null
}

function progressOf(lesson: Lesson): Progress {
  const v = lesson.tutorial
  const codes = loadVariantCodes(v) ?? v.initial
  const list = stationList(lesson, lessonProgress(lesson, codes))
  const here = hereStation(list)
  const steps = lesson.steps.length
  return {
    started: codes.some((c, i) => c !== v.initial[i]),
    done: here.kind === 'finish' && here.state === 'done',
    here: {
      title: here.title,
      pic: here.pic,
      label: here.kind === 'step' ? `Шаг ${here.n} из ${steps}` : here.kind === 'extra' ? 'Бонус' : 'Финиш',
    },
    hero: chosenPic(codes, lesson.card.heroVar) ?? lesson.card.hero,
    item: (lesson.card.itemVar && chosenPic(codes, lesson.card.itemVar)) ?? lesson.card.item ?? null,
  }
}

/** У какой игры красная клавиша: последняя открытая и не пройденная, иначе первая начатая и не пройденная, иначе первая. */
function mainGame(progress: Progress[]): number {
  const open = (i: number) => i >= 0 && progress[i].started && !progress[i].done
  const last = LESSONS.findIndex((l) => l.id === loadLastGame())
  if (open(last)) return last
  const started = progress.findIndex((_, i) => open(i))
  if (started >= 0) return started
  const fresh = progress.findIndex((p) => !p.done)
  return fresh >= 0 ? fresh : 0
}

/** «3 шага», «5 шагов», «1 бонус». */
function count(n: number, [one, few, many]: [string, string, string]): string {
  const d = n % 10
  const word = n % 100 >= 11 && n % 100 <= 14 ? many : d === 1 ? one : d >= 2 && d <= 4 ? few : many
  return `${n} ${word}`
}

function GameCard({ lesson, p, main }: { lesson: Lesson; p: Progress; main: boolean }) {
  const id = `game-${lesson.id}`

  return (
    <article className={styles.card} aria-labelledby={id} data-main={main}>
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

        <p className={styles.where}>
          {p.done ? (
            <span className="chip chip--ok">
              <CheckIcon size={12} />
              Пройдена целиком
            </span>
          ) : p.started ? (
            <span className="chip chip--todo">
              <Pic name={p.here.pic} className={styles.wherePic} />
              {p.here.label} · {p.here.title}
            </span>
          ) : (
            <span className="chip chip--todo">
              {count(lesson.steps.length, ['шаг', 'шага', 'шагов'])} ·{' '}
              {count(lesson.extras.length, ['бонус', 'бонуса', 'бонусов'])}
            </span>
          )}
        </p>

        <a className={`key ${main ? 'key--apple' : ''} key--l ${styles.play}`} href={gameHref(lesson.id)}>
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
