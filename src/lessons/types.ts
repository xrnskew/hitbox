// Описание урока. Ядро ничего не знает про яблоки, птиц и пришельцев: всё, что относится
// к конкретной игре, лежит в пакете урока (src/lessons/<id>/).

export interface TabDef {
  id: string
  /** Название вкладки: «Движок», «Герой»… */
  title: string
  /** Номер шага, если вкладка — шаг гайда. */
  step?: number
  /** Однострочная подсказка над редактором. */
  note: string
}

export interface LessonVariant {
  id: 'tutorial' | 'finished'
  /** Ключ localStorage для кода. Активная вкладка — `${storageKey}:active`. */
  storageKey: string
  tabs: TabDef[]
  initial: string[]
  hasGuide: boolean
  /** Список «Что тут есть» под игрой (только в готовой версии). */
  features?: string[]
}

/**
 * Текст гайда: абзац, в котором `код` — инлайн-код, а [[Ctrl+Z]] — клавиша.
 */
export type Rich = string

export interface GuideStep {
  step: number
  /** Картинка станции на карте гайда — из набора HitBox. */
  pic: string
  /** Индекс вкладки, куда вставляется код. */
  tab: number
  title: string
  /** Одна строка: что получится после шага. */
  lead: Rich
  /** «Как это работает» — открывается по кнопке. */
  how: Rich[]
  code: string
  /** Что проверить после запуска — коротко. */
  checks: Rich[]
  /** Функции, которые должны быть объявлены и не пустые. */
  fns: string[]
  /** Квесты шага — открываются по одному. Следующий шаг откроется, когда выполнены все. */
  quests: StepTask[]
}

/** Куда вставить кусок кода: после строки `after` (с 1). */
export interface InsertPlan {
  after: number
  text: string
}

/** Задание «поправь сам»: кнопка открывает вкладку и выделяет, что менять. */
export interface EditTask {
  kind: 'edit'
  title: string
  text: Rich
  tab: number
  /** Что выделить в коде: первая группа регулярного выражения (флаг d). */
  target: RegExp
  hint: Rich[]
  isDone: (code: string) => boolean
  /** Меняется рисунок или цвет: кнопка в гайде сразу открывает окно выбора. */
  picker?: 'pic' | 'color'
}

/** Кусок функции, который добавляется кнопкой. */
export interface BuildPiece {
  title: string
  /** Куда и что вставить (вставка всплывает в коде призраком); null — пока нельзя (нет предыдущей части). */
  plan: (code: string) => InsertPlan | null
  isDone: (code: string) => boolean
}

/** Задание «собери по частям»: функция собирается кнопками кусок за куском. */
export interface BuildTask {
  kind: 'build'
  title: string
  text: Rich
  tab: number
  pieces: BuildPiece[]
  /** Уведомление, когда собраны все части. */
  doneText: string
}

/** Квест «нажми «Собрать»»: засчитан, когда последний запуск был уже с нужным кодом. */
export interface RunTask {
  kind: 'run'
  title: string
  text: Rich
  tab: number
  /** Подпись у подсвеченной кнопки «Собрать», пока квест не выполнен. */
  callout: string
  /** Уведомление, когда квест выполнен. */
  doneText: string
  /** Проверка по коду последнего запуска. */
  isDone: (ranCodes: string[]) => boolean
}

export type StepTask = EditTask | BuildTask | RunTask

export interface GuideExtra {
  n: number
  /** Картинка задания из набора HitBox (на значке в гайде). */
  pic: string
  title: string
  text: Rich
  /** Одна строка в «Движок». */
  setting: { tab: number; name: string; line: string }
  /** Код для нескольких вкладок — вставляется одной кнопкой. */
  codes: { tab: number; code: string; marks: RegExp[] }[]
}

export interface GuideIntro {
  title: string
  lead: Rich
  /** Короткие подсказки с клавишами. */
  tips: Rich[]
}

export interface Hint {
  name: string
  kind: 'variable' | 'function' | 'property' | 'method' | 'constant'
  /** Короткая подпись в списке автодополнения, например `(x, y)`. */
  detail?: string
  text: string
}

export interface HintSet {
  globals: Hint[]
  /** Подсказки после точки: `ctx.`, `Math.`, `console.`… */
  members: Record<string, Hint[]>
  /** Переменные, которые показываются в «Приборах». */
  watch: string[]
}

/** Кнопки на корпусе приставки и подписи про управление. */
export interface LessonControls {
  /** Кнопки шлют в игру нажатие клавиши `key` — и мышью, и пальцем. */
  buttons: { key: string; label: string; icon: 'left' | 'right' | 'up'; wide?: boolean }[]
  /** Какие клавиши жать — у лампочки на рамке: «жми ← →». */
  keysHint: string
  /** Подсказка у тумблера «Границы»: что он показывает. */
  hitboxes: string
}

export interface Lesson {
  /** Адрес игры: `?game=<id>`. */
  id: string
  title: string
  /** Карточка в главном меню. */
  card: {
    /** Сложность: подпись и сколько делений из четырёх. */
    level: string
    levelBars: number
    blurb: string
    /** Картинки на экране карточки, если ученик ещё не выбрал своих. */
    hero: string
    item?: string
    /** Переменные с картинками ученика: если он их поменял, карточка показывает его героя. */
    heroVar: string
    itemVar?: string
    /** Что показывает экран карточки: падающие предметы, полёт между трубами или бой в космосе. */
    scene: 'catch' | 'bird' | 'space'
  }
  controls: LessonControls
  /**
   * Цвет корпуса приставки — и в игре, и на карточке в меню. Он же — цвет сложности на карточке:
   * «очень легко» — белый, «легко» — зелёный, «сложно» — красный.
   */
  consoleColor: 'white' | 'green' | 'yellow' | 'red'
  tutorial: LessonVariant
  finished: LessonVariant
  intro: GuideIntro
  steps: GuideStep[]
  extras: GuideExtra[]
  /** Заголовок раздела дополнительных заданий в гайде: «Бомба и звезда», «Взрывы и волны». */
  extrasTitle: string
  /** Предупреждение под дополнительными заданиями. */
  extrasNote: Rich
  hints: HintSet
}
