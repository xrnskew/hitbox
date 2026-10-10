import { explainRuntimeError, formatError, isSyntaxMessage } from '@/core/errors.ts'
import {
  currentQuest,
  hereStation,
  type LevelState,
  lessonProgress,
  levelStates,
  questChain,
  stationList,
} from '@/core/levels.ts'
import { checkFinishedPassword } from '@/core/lock.ts'
import { hasContent, stepDone } from '@/core/progress.ts'
import { findSyntaxError, firstSyntaxError, type SyntaxIssue } from '@/core/syntax.ts'
import { createTabEditors, type TabEditors } from '@/editor/createTabEditors.ts'
import type { PickSpot } from '@/editor/pickers.ts'
import type { SlotSource } from '@/editor/slots.ts'
import { editTarget } from '@/lessons/kit.ts'
import type { BuildTask, Lesson, LessonVariant, RunTask } from '@/lessons/types.ts'
import { runner } from '@/sandbox/harness.ts'
import {
  loadActive,
  loadBest,
  loadCodes,
  rememberFinishedUnlocked,
  saveActive,
  saveBest,
  saveCodes,
} from '@/sandbox/storage.ts'
import { finishedHref } from './routes.ts'
import { createStore, type Store } from './store.ts'

export type View = 'guide' | number
/** running — идёт; over — игра окончена (жизни кончились или gameOver); stopped — упала с ошибкой; blocked — не запустилась. */
export type GameStatus = 'running' | 'over' | 'stopped' | 'blocked'
export type Panel = 'inspector' | 'console'

export interface ShownError {
  text: string
  tab: number | null
  line: number | null
}

export interface Toast {
  id: number
  text: string
  undo?: () => void
  ms: number
}

export type Dialog = null | { kind: 'reset'; tab: number } | { kind: 'resetAll' } | { kind: 'unlock' }

/** Открытое окно выбора рисунка или цвета: что заменить и где его показать. */
export interface Picker extends PickSpot {
  tab: number
  /** Что было в кавычках, когда окно открыли. */
  was: string
}

export interface AppState {
  view: View
  /** Снимок кода для интерфейса (значки, гайд). Обновляется с задержкой после печати. */
  codes: string[]
  /** Код последнего запуска: по нему видно, есть ли несобранные изменения. */
  ran: string[]
  /** Живая проверка синтаксиса по вкладкам. */
  syntax: (SyntaxIssue | null)[]
  /** Вкладка с ошибкой выполнения из последнего запуска — пока её не поправили. */
  runtimeErrorTab: number | null
  error: ShownError | null
  runId: number
  doc: string
  game: GameStatus
  gameFocused: boolean
  hitboxes: boolean
  best: number
  lastScore: number
  toast: Toast | null
  dialog: Dialog
  panel: Panel
  unreadLogs: number
  picker: Picker | null
  /** Подсветку «Собрать» закрыли — до следующего запуска. */
  spotOff: boolean
  /** Станция карты, которую ученик открыл сам, и где он был в тот момент. Ученик ушёл дальше — выбор забыт,
   *  под картой снова текущая станция. null — показываем текущую. */
  station: { key: string; at: string } | null
}

export interface LogEntry {
  id: number
  level: 'log' | 'warn' | 'error'
  text: string
  count: number
}

export type TabBadge = 'engine' | 'empty' | 'code' | 'done' | 'error'

const SNAPSHOT_DELAY = 250
const SAVE_DELAY = 400
const MAX_LOGS = 200

export type Controller = ReturnType<typeof createController>

export function createController(lesson: Lesson, variant: LessonVariant) {
  const tabs = variant.tabs
  const key = variant.storageKey

  let latestCodes = loadCodes(key, tabs.length) ?? [...variant.initial]
  const savedView = loadActive(key, tabs.length)
  const startView: View = variant.hasGuide ? (savedView ?? 'guide') : typeof savedView === 'number' ? savedView : 0

  const syntaxCache = new Map<string, SyntaxIssue | null>()
  const checkSyntax = (code: string) => {
    let issue = syntaxCache.get(code)
    if (issue === undefined) {
      issue = findSyntaxError(code)
      if (syntaxCache.size > 64) syntaxCache.clear()
      syntaxCache.set(code, issue)
    }
    return issue
  }

  const store: Store<AppState> = createStore<AppState>({
    view: startView,
    codes: latestCodes,
    ran: latestCodes,
    syntax: latestCodes.map(checkSyntax),
    runtimeErrorTab: null,
    error: null,
    runId: 0,
    doc: '',
    game: 'running',
    gameFocused: false,
    hitboxes: false,
    best: loadBest(key),
    lastScore: 0,
    toast: null,
    dialog: null,
    panel: 'inspector',
    unreadLogs: 0,
    picker: null,
    spotOff: false,
    station: null,
  })
  const logs = createStore<{ entries: LogEntry[] }>({ entries: [] })
  const inspector = createStore<{ values: Record<string, string> }>({ values: {} })

  let editors: TabEditors | null = null
  let frame: HTMLIFrameElement | null = null
  let runCodes = latestCodes
  let preRunSyntax = false
  let snapshotTimer = 0
  let saveTimer = 0
  let toastId = 0
  let logId = 0

  const codesNow = () => (editors ? editors.getCodes() : latestCodes)
  /** Код всех вкладок, но у одной — новый (редактор ещё не применил правку). */
  const codesWith = (tab: number, code: string) => codesNow().map((c, i) => (i === tab ? code : c))
  const title = (tab: number) => tabs[tab].title

  // ===== Сохранение =====
  function saveNow() {
    clearTimeout(saveTimer)
    saveTimer = 0
    latestCodes = codesNow()
    saveCodes(key, latestCodes)
  }

  function snapshot() {
    clearTimeout(snapshotTimer)
    snapshotTimer = 0
    latestCodes = codesNow()
    const prev = store.get()
    const codes = latestCodes.map((c, i) => (c === prev.codes[i] ? prev.codes[i] : c))
    const same = codes.every((c, i) => c === prev.codes[i])
    if (same) return
    store.set({ codes, syntax: codes.map(checkSyntax) })
    if (!variant.hasGuide) return
    // квест мог смениться из-за правки в другой вкладке — куски во вкладке пересчитываем
    editors?.refreshSlots()
    announceEdit(levelsOf(prev.codes), levelsOf(codes))
  }

  function onChange(tab: number, byUser: boolean) {
    if (byUser) {
      dismissToast()
      if (store.get().runtimeErrorTab === tab) store.set({ runtimeErrorTab: null })
    }
    clearTimeout(snapshotTimer)
    snapshotTimer = window.setTimeout(snapshot, SNAPSHOT_DELAY)
    clearTimeout(saveTimer)
    saveTimer = window.setTimeout(saveNow, SAVE_DELAY)
  }

  // ===== Уведомления =====
  function toast(text: string, undo?: () => void, ms = 10_000) {
    store.set({ toast: { id: ++toastId, text, undo, ms } })
  }
  function dismissToast() {
    if (store.get().toast) store.set({ toast: null })
  }

  // ===== Вкладки =====
  function selectView(view: View) {
    if (typeof view === 'number') editors?.show(view)
    editors?.setVisible(view !== 'guide')
    if (store.get().view === view) return
    store.set({ view })
    saveActive(key, view)
    saveNow()
  }

  // ===== Запуск =====
  function launch(codes: string[]) {
    const before = variant.hasGuide ? levelsOf(codes) : null
    runCodes = codes
    editors?.clearErrors()
    dismissToast()
    logs.set({ entries: [] })
    inspector.set({ values: {} })

    const bad = firstSyntaxError(codes)
    preRunSyntax = bad !== null
    let error: ShownError | null = null
    if (bad) {
      const { line, message } = bad.issue
      error = { text: formatError({ title: title(bad.tab), line }, message), tab: bad.tab, line }
      editors?.markError(bad.tab, line)
    }
    const s = store.get()
    store.set({
      doc: runner.buildDoc(codes, { focus: !bad, hitboxes: s.hitboxes, game: lesson.id }),
      runId: s.runId + 1,
      ran: codes,
      spotOff: false,
      picker: null,
      error,
      runtimeErrorTab: null,
      game: bad ? 'blocked' : 'running',
      gameFocused: false,
      lastScore: 0,
      unreadLogs: 0,
    })
    // Нашли ошибку до запуска — игра не стартует, фокус остаётся в редакторе.
    if (bad) editors?.focus()
    if (before) {
      editors?.refreshSlots()
      announceRun(before, levelsOf(codes))
    }
  }

  function run() {
    saveNow()
    snapshot()
    launch(latestCodes)
  }

  function onGameError(message: string, line: number) {
    // Пока есть ошибка, найденная до запуска, синтаксические сообщения из iframe игнорируем.
    if (preRunSyntax && isSyntaxMessage(message)) return
    if (store.get().error) return
    const place = line ? runner.locate(line, runCodes) : null
    const text = formatError(place ? { title: title(place.tab), line: place.line } : null, explainRuntimeError(message))
    if (place) editors?.markError(place.tab, place.line)
    store.set({
      error: { text, tab: place?.tab ?? null, line: place?.line ?? null },
      runtimeErrorTab: place?.tab ?? null,
    })
  }

  function showError() {
    const err = store.get().error
    if (!err || err.tab === null) return
    selectView(err.tab)
    if (err.line) editors?.gotoLine(err.line)
  }

  // ===== Игра =====
  function onMessage(e: MessageEvent) {
    // Принимаем сообщения только от текущего iframe.
    if (!frame || e.source !== frame.contentWindow) return
    const d = e.data as { tb?: number; type?: string; [k: string]: unknown }
    if (!d || d.tb !== 1) return
    switch (d.type) {
      case 'err':
        onGameError(String(d.message), Number(d.line) || 0)
        break
      case 'run':
        run()
        break
      case 'focus':
        store.set({ gameFocused: d.on === true })
        break
      case 'stopped':
        if (store.get().game === 'running') store.set({ game: 'stopped' })
        break
      case 'log':
        appendLogs(d.entries as Omit<LogEntry, 'id'>[])
        break
    }
  }

  function appendLogs(entries: Omit<LogEntry, 'id'>[]) {
    if (!Array.isArray(entries) || !entries.length) return
    let list = logs.get().entries.slice()
    for (const e of entries) {
      const last = list[list.length - 1]
      if (last && last.text === e.text && last.level === e.level)
        list[list.length - 1] = { ...last, count: last.count + e.count }
      else list.push({ id: ++logId, level: e.level, text: String(e.text), count: e.count })
    }
    if (list.length > MAX_LOGS) list = list.slice(-MAX_LOGS)
    logs.set({ entries: list })
    const s = store.get()
    if (s.panel !== 'console') store.set({ unreadLogs: Math.min(99, s.unreadLogs + entries.length) })
  }

  function sendCtl(msg: Record<string, unknown>) {
    try {
      frame?.contentWindow?.postMessage({ tbc: 1, ...msg }, '*')
    } catch {
      // iframe ещё не готов
    }
  }

  function focusGame() {
    try {
      frame?.contentWindow?.focus()
    } catch {
      // ничего
    }
  }

  function formatValue(v: unknown): string {
    if (v === undefined) return '—'
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(1)
    if (typeof v === 'string') return JSON.stringify(v)
    if (Array.isArray(v)) return `${v.length} шт.`
    if (typeof v === 'object' && v !== null) return '{…}'
    return String(v)
  }

  // «Приборы», «Игра окончена» и рекорд: 5 раз в секунду, только пока вкладка видна.
  function poll() {
    if (document.hidden || !frame) return
    let w: Record<string, unknown> | null = null
    try {
      w = frame.contentWindow as unknown as Record<string, unknown>
    } catch {
      return
    }
    if (!w) return
    const values: Record<string, string> = {}
    let changed = false
    const prev = inspector.get().values
    for (const name of lesson.hints.watch) {
      values[name] = formatValue(w[name])
      if (values[name] !== prev[name]) changed = true
    }
    if (changed) inspector.set({ values })

    const s = store.get()
    const score = w.score
    const lives = w.lives
    if (typeof score !== 'number') return
    if (score > s.best) {
      store.set({ best: score })
      saveBest(key, score)
    }
    // конец игры: кончились жизни (Корзинка, Космос) или движок поднял флаг gameOver (Птичка)
    const over = w.gameOver === true || (typeof lives === 'number' && lives <= 0)
    if (s.game === 'running' && over) store.set({ game: 'over', lastScore: score })
  }

  // ===== Гайд: квесты =====
  // Цепочка квестов: шаги, за ними бонусы. Номер уровня — в этой цепочке: бонус 1 идёт сразу за последним шагом.
  const chain = questChain(lesson)
  const levelsOf = (codes: string[], ran = store.get().ran): LevelState[] => levelStates(chain, codes, ran)
  const questAt = (step: number, quest: number) => chain[step]?.quests[quest]
  /** «Шаг 2» или «Бонус «Бомба»» — по номеру уровня в цепочке. */
  const levelName = (i: number) =>
    i < lesson.steps.length ? `Шаг ${i + 1}` : `Бонус «${lesson.extras[i - lesson.steps.length].title}»`

  /** Квест «поправь сам» выполнен (печатью или из окна выбора) — говорим, что дальше. */
  function announceEdit(before: LevelState[], after: LevelState[]) {
    const cur = currentQuest(chain, before)
    if (!cur) return
    const task = questAt(cur.step, cur.quest)
    if (task.kind !== 'edit' || !after[cur.step].questsDone[cur.quest]) return
    toast(`Квест «${task.title}» выполнен!${whatNext(after, cur.step)}`)
  }

  /** Квест «нажми «Собрать»» выполнен запуском. */
  function announceRun(before: LevelState[], after: LevelState[]) {
    const cur = currentQuest(chain, before)
    if (!cur) return
    const task = questAt(cur.step, cur.quest)
    if (task.kind !== 'run' || !after[cur.step].questsDone[cur.quest]) return
    toast(`${task.doneText}${whatNext(after, cur.step)}`)
  }

  /** Подсказка, где следующий квест. */
  function whatNext(levels: LevelState[], step: number): string {
    const next = currentQuest(chain, levels)
    if (!next) return levels.every((l) => l.done) ? ' Всё готово — загляни на финиш в «Гайде».' : ''
    if (next.step !== step && next.step === lesson.steps.length)
      return ` Игра собрана! ${levelName(next.step)} открыт — он в «Гайде».`
    if (next.step !== step) return ` ${levelName(next.step)} открыт — он в «Гайде».`
    const task = questAt(next.step, next.quest)
    if (task.kind === 'build' && task.tab === editors?.current) return ' Дальше — жми «Добавить» прямо в коде.'
    return ` Следующий квест «${task.title}» — в «Гайде».`
  }

  /** Показать под картой станцию (`step-2`, `extra-4`, `finish`) и открыть «Гайд». */
  function showStation(key: string) {
    const { codes, ran } = store.get()
    const here = hereStation(stationList(lesson, lessonProgress(lesson, codes, ran))).key
    store.set({ station: key === here ? null : { key, at: here } })
    selectView('guide')
  }

  /** Открыть квест: «собери» — к всплывшему куску, «поправь» — выделить, что менять, «нажми» — собрать. */
  function openTask(stepIndex: number, questIndex: number) {
    const task = questAt(stepIndex, questIndex)
    if (!task || !editors) return
    if (task.kind === 'run') {
      run()
      return
    }
    selectView(task.tab)
    if (task.kind === 'build') {
      const next = nextPiece(task, editors.getCode(task.tab))
      if (next) editors.gotoLine(next.plan.after)
      else editors.focus()
      return
    }
    const at = editTarget(editors.getCode(task.tab), task.target)
    if (!at) {
      editors.focus()
      return
    }
    editors.select(at.line, at.from, at.to)
    if (task.picker) {
      const ed = editors
      const from = ed.posOf(at.line, at.from)
      const to = ed.posOf(at.line, at.to)
      // окно — после прокрутки к строке, иначе оно встанет по старым координатам
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const rect = ed.coordsAt(to + 1)
          if (rect && ed.current === task.tab && task.picker)
            openPicker(task.tab, { from, to, rect, kind: task.picker })
        }),
      )
    }
  }

  /** Какую часть сборки добавлять сейчас: первая несделанная, если для неё есть место. */
  function nextPiece(task: BuildTask, code: string) {
    const index = task.pieces.findIndex((p) => !p.isDone(code))
    if (index < 0) return null
    const plan = task.pieces[index].plan(code)
    return plan ? { index, plan } : null
  }

  /** Текущий квест, если это сборка во вкладке `tab`. */
  function buildingIn(tab: number, codes: string[]) {
    const cur = currentQuest(chain, levelsOf(codes))
    const task = cur && questAt(cur.step, cur.quest)
    return cur && task?.kind === 'build' && task.tab === tab ? { ...cur, task } : null
  }

  /** Источник кусков для редактора: во вкладке, где сейчас идёт сборка по кусочкам. */
  function slotSources(): (SlotSource | null)[] {
    return variant.tabs.map((_, tab) => {
      if (!variant.hasGuide) return null
      if (!chain.some((s) => s.quests.some((q) => q.kind === 'build' && q.tab === tab))) return null
      return (code: string) => {
        const cur = buildingIn(tab, codesWith(tab, code))
        if (!cur) return null
        const next = nextPiece(cur.task, code)
        if (!next) return null
        const piece = cur.task.pieces[next.index]
        return {
          after: next.plan.after,
          replace: next.plan.replace,
          code: next.plan.text.replace(/^\n+/, ''),
          n: next.index + 1,
          total: cur.task.pieces.length,
          title: piece.title,
          onAdd: () => insertPiece(cur.step, cur.quest, next.index),
        }
      }
    })
  }

  /** Сборка по кусочкам: добавить кусок. */
  function insertPiece(stepIndex: number, questIndex: number, pieceIndex: number) {
    const task = questAt(stepIndex, questIndex)
    if (task?.kind !== 'build' || !editors) return
    const piece = task.pieces[pieceIndex]
    const code = editors.getCode(task.tab)
    selectView(task.tab)
    if (piece.isDone(code)) {
      toast(`«${piece.title}» уже есть во вкладке «${title(task.tab)}».`)
      return
    }
    const plan = piece.plan(code)
    if (!plan) {
      toast('Сначала добавь предыдущую часть.')
      return
    }
    const line = editors.insertLine(task.tab, plan.after, plan.text, plan.replace)
    editors.gotoLine(line)
    const ed = editors
    const codes = codesNow()
    // следующий кусок может всплыть далеко от этого: прокручиваем к нему
    const cur = buildingIn(task.tab, codes)
    const next = cur && nextPiece(cur.task, codes[task.tab])
    if (next) ed.reveal(next.plan.after)
    const done = task.pieces.every((p) => p.isDone(codes[task.tab]))
    const verb = next?.plan.replace ? 'Заменить' : 'Добавить'
    toast(
      done
        ? `${task.doneText}${cur && cur.task !== task ? ` Дальше — «${cur.task.title}»: жми «${verb}».` : ''}`
        : `Часть ${pieceIndex + 1} из ${task.pieces.length} на месте. Жми «${verb}» у следующей.`,
      () => ed.undo(task.tab),
    )
  }

  // ===== Окно выбора рисунка или цвета =====
  function openPicker(tab: number, spot: PickSpot) {
    if (!editors) return
    store.set({ picker: { ...spot, tab, was: editors.getCode(tab).slice(spot.from, spot.to) } })
  }

  function closePicker(refocus = true) {
    if (!store.get().picker) return
    store.set({ picker: null })
    if (refocus) editors?.focus()
  }

  /** Выбрали в окне рисунок или цвет: он встаёт между кавычками правкой ученика (отменяется Ctrl+Z). */
  function pick(value: string) {
    const p = store.get().picker
    if (!p || !editors) return
    store.set({ picker: null })
    if (editors.current !== p.tab || editors.getCode(p.tab).slice(p.from, p.to) !== p.was) {
      toast('Код уже поменялся — нажми «Сменить» ещё раз.')
      return
    }
    editors.replaceRange(p.from, p.to, value)
    editors.focus()
    // что квест выполнен, скажет снимок кода — так же, как после печати
    snapshot()
  }

  /** Готовая игра под паролем: true — пароль подошёл. */
  function unlockFinished(password: string): boolean {
    if (!checkFinishedPassword(password)) return false
    rememberFinishedUnlocked()
    saveNow()
    const href = finishedHref(lesson.id)
    const opened = window.open(href, '_blank')
    if (!opened) location.assign(href)
    return true
  }

  // ===== Сбросы =====
  function replaceAll(codes: string[]): number[] {
    if (!editors) return []
    const ed = editors
    // Только изменённые вкладки: замена неизменённой испортила бы отмену на ней.
    const changed = codes.map((_, i) => i).filter((i) => ed.getCode(i) !== codes[i])
    for (const i of changed) ed.replace(i, codes[i])
    return changed
  }

  function undoAll(changed: number[]) {
    for (const i of changed) editors?.undo(i)
  }

  function confirmReset(tab: number) {
    if (!editors) return
    const code = variant.initial[tab]
    if (editors.getCode(tab) === code) {
      toast(`«${title(tab)}» и так в исходном виде.`)
      return
    }
    editors.replace(tab, code)
    const ed = editors
    toast(tab === 0 ? '«Движок» сброшен.' : `Вкладка «${title(tab)}» сброшена.`, () => ed.undo(tab))
  }

  function confirmResetAll() {
    const changed = replaceAll(variant.initial)
    if (variant.hasGuide) selectView('guide')
    run()
    if (changed.length) toast('Весь код вернулся к началу.', () => undoAll(changed), 30_000)
    else toast('Код и так в исходном виде.')
  }

  // ===== Запуск приложения =====
  window.addEventListener('message', onMessage)
  window.addEventListener('pagehide', saveNow)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveNow()
  })
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.defaultPrevented && !store.get().dialog) {
      e.preventDefault()
      run()
    }
  })
  window.setInterval(poll, 200)

  launch(latestCodes)

  return {
    lesson,
    variant,
    store,
    logs,
    inspector,

    mountEditor(parent: HTMLElement) {
      const view = store.get().view
      editors = createTabEditors({
        parent,
        docs: latestCodes,
        active: typeof view === 'number' ? view : 0,
        hints: lesson.hints,
        lint: checkSyntax,
        onChange,
        onRun: run,
        slots: slotSources(),
        onPick: openPicker,
      })
      editors.setVisible(view !== 'guide')
      const err = store.get().error
      if (err && err.tab !== null && err.line) editors.markError(err.tab, err.line)
      return () => {
        latestCodes = codesNow()
        editors?.destroy()
        editors = null
      }
    },

    selectView,
    run,
    showError,
    focusEditor: () => editors?.focus(),

    setFrame(el: HTMLIFrameElement | null) {
      frame = el
    },
    onFrameLoad() {
      if (!preRunSyntax) focusGame()
    },
    focusGame,
    toggleHitboxes() {
      const hitboxes = !store.get().hitboxes
      store.set({ hitboxes })
      sendCtl({ type: 'ctl', hitboxes })
    },
    pressKey(k: string, down: boolean) {
      sendCtl({ type: 'key', key: k, down })
    },
    setPanel(panel: Panel) {
      store.set(panel === 'console' ? { panel, unreadLogs: 0 } : { panel })
    },
    clearLogs() {
      logs.set({ entries: [] })
    },

    openTask,
    showStation,
    insertPiece,
    pick,
    closePicker,
    dismissSpot() {
      store.set({ spotOff: true })
    },
    unlockFinished,

    toast,
    dismissToast,
    openDialog(dialog: Dialog) {
      store.set({ dialog })
    },
    closeDialog() {
      store.set({ dialog: null })
    },
    /** После закрытия окна фокус — в редактор, иначе Ctrl+Z сразу после сброса не сработает. */
    afterDialog() {
      if (typeof store.get().view === 'number') editors?.focus()
    },
    confirmReset,
    confirmResetAll,
  }
}

// ===== Производные значения для интерфейса =====

export function tabBadges(c: Controller, s: Pick<AppState, 'codes' | 'syntax' | 'runtimeErrorTab'>): TabBadge[] {
  const steps = c.variant.hasGuide ? c.lesson.steps : []
  return c.variant.tabs.map((_, i) => {
    if (s.syntax[i] || s.runtimeErrorTab === i) return 'error'
    if (i === 0) return 'engine'
    const step = steps.find((st) => st.tab === i)
    if (step && stepDone(s.codes[i], step.fns)) return 'done'
    return hasContent(s.codes[i]) ? 'code' : 'empty'
  })
}

/** Квест «нажми «Собрать»», если он сейчас текущий: тогда кнопка подсвечивается поверх затемнения. */
export function runQuestNow(c: Controller, codes: string[], ran: string[]): RunTask | null {
  if (!c.variant.hasGuide) return null
  const chain = questChain(c.lesson)
  const cur = currentQuest(chain, levelStates(chain, codes, ran))
  const task = cur && chain[cur.step].quests[cur.quest]
  return task?.kind === 'run' ? task : null
}
