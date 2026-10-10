// Адреса внутри сайта. Только параметры запроса: так одинаково работает сайт и в корне домена, и в подпапке.

/** Главное меню — выбор игры. */
export const homeHref = () => location.pathname

/** Учебная версия игры. */
export const gameHref = (id: string) => `?game=${encodeURIComponent(id)}`

/** Готовая версия игры (под паролем). */
export const finishedHref = (id: string) => `${gameHref(id)}&finished`

/** Что открыть по адресу: меню или игру; `?finished` без игры — готовая Корзинка, как раньше. */
export function readRoute(fallbackGame: string): { kind: 'home' } | { kind: 'game'; id: string; finished: boolean } {
  const q = new URLSearchParams(location.search)
  const finished = q.has('finished')
  const id = q.get('game') ?? (finished ? fallbackGame : null)
  return id ? { kind: 'game', id, finished } : { kind: 'home' }
}
