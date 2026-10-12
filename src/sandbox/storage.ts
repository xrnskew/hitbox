import { type MovedSetting, moveSettings } from '@/core/migrate.ts'

// Сохранение в localStorage. Всё в try/catch: нет хранилища (приватный режим,
// запрет сайта) — приложение работает без сохранения. Битые данные или не та длина
// массива — стартуем с исходного кода.

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // нет места или нет доступа — работаем без сохранения
  }
}

export function loadCodes(key: string, count: number): string[] | null {
  const raw = read(key)
  if (!raw) return null
  try {
    const data: unknown = JSON.parse(raw)
    if (Array.isArray(data) && data.length === count && data.every((x) => typeof x === 'string')) return data
  } catch {
    // битые данные
  }
  return null
}

/** Код урока из сохранения (старое — с переездом настроек из «Движка») или null, если сохранения нет. */
export function loadVariantCodes(v: {
  storageKey: string
  initial: string[]
  moved?: MovedSetting[]
}): string[] | null {
  const codes = loadCodes(v.storageKey, v.initial.length)
  return codes && v.moved ? moveSettings(codes, v.moved) : codes
}

export function saveCodes(key: string, codes: string[]) {
  write(key, JSON.stringify(codes))
}

export type SavedView = 'guide' | number

export function loadActive(key: string, count: number): SavedView | null {
  const raw = read(`${key}:active`)
  if (raw === 'guide') return 'guide'
  const n = Number(raw)
  return raw !== null && Number.isInteger(n) && n >= 0 && n < count ? n : null
}

export function saveActive(key: string, view: SavedView) {
  write(`${key}:active`, String(view))
}

export function loadBest(key: string): number {
  const n = Number(read(`${key}:best`))
  return Number.isFinite(n) && n > 0 ? n : 0
}

export function saveBest(key: string, best: number) {
  write(`${key}:best`, String(best))
}

// Готовая игра открыта паролем — помним до закрытия вкладки (sessionStorage).
const UNLOCK_KEY = 'catch-sandbox-finished-unlocked'

export function isFinishedUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === '1'
  } catch {
    return false
  }
}

export function rememberFinishedUnlocked() {
  try {
    sessionStorage.setItem(UNLOCK_KEY, '1')
  } catch {
    // нет хранилища — пароль спросят ещё раз
  }
}

const LAST_GAME_KEY = 'hitbox-last-game'

/** Игра, которую ученик открывал последней: в меню «Продолжить» — у неё. */
export function loadLastGame(): string | null {
  return read(LAST_GAME_KEY)
}

export function rememberLastGame(id: string) {
  write(LAST_GAME_KEY, id)
}

/**
 * Стереть всё, что сайт хранит в браузере: код и вкладки всех игр, рекорды, последнюю игру, открытую готовую.
 * `keys` — ключи кода (storageKey всех вариантов всех игр).
 */
export function wipeAll(keys: string[]) {
  try {
    for (const key of keys) for (const k of [key, `${key}:active`, `${key}:best`]) localStorage.removeItem(k)
    localStorage.removeItem(LAST_GAME_KEY)
  } catch {
    // нет хранилища — и стирать нечего
  }
  try {
    sessionStorage.removeItem(UNLOCK_KEY)
  } catch {
    // нет хранилища
  }
}
