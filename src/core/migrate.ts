import { hasContent, stripComments } from './progress.ts'

// Старые сохранения: настройки шагов (скорость героя, гравитация…) раньше жили в «Движке», теперь — во вкладке
// своего шага, рядом с кодом, который их использует. При загрузке строка переезжает сама, и прогресс ученика
// не теряется. Чистый модуль: без DOM.

/** Настройка, которая переехала из «Движка» во вкладку шага. */
export interface MovedSetting {
  name: string
  /** Вкладка шага. */
  tab: number
  /** Значение в старом движке, пока ученик его не менял: `0`, `"#5ec639"`. */
  was: string
  /** Строка во вкладке шага с этим значением — с тем же комментарием, что ставит кусок квеста. */
  line: (value: string) => string
  /** Над какой функцией вкладки встаёт строка, если её не видно в коде функций (цвет берёт функция движка). */
  above?: string
}

const varRe = (name: string) => new RegExp(`^\\s*var\\s+${name}\\s*=\\s*(.*?)\\s*;?\\s*$`)

/**
 * Переносит настройки из «Движка» (вкладка 0) во вкладки шагов. Ученик менял значение или уже собирает шаг —
 * строка встаёт во вкладку шага над первой функцией, которая её использует (иначе в конец). Не менял, а шаг
 * ещё пустой — строка просто уходит: её добавит кусок квеста. Во вкладке уже есть своя — из движка убирается.
 * Заодно старт `loop();` в конце движка становится `requestAnimationFrame(loop);` — первый кадр после всех вкладок.
 */
export function moveSettings(codes: string[], moved: MovedSetting[]): string[] {
  const out = [...codes]
  for (const s of moved) {
    const engine = out[0].split('\n')
    const clean = stripComments(out[0]).split('\n')
    const at = clean.findIndex((l) => varRe(s.name).test(l))
    if (at < 0) continue
    const value = varRe(s.name).exec(clean[at])![1]
    engine.splice(at, 1)
    out[0] = engine.join('\n')

    const target = out[s.tab]
    if (
      stripComments(target)
        .split('\n')
        .some((l) => varRe(s.name).test(l))
    )
      continue
    if (value === s.was && !hasContent(target)) continue
    const lines = target.split('\n')
    const uses = new RegExp(`\\b${s.name}\\b`)
    const tops = stripComments(target).split('\n')
    // первая функция, в теле которой есть эта настройка (тело — до строки, что начинается с })
    let fn = s.above
      ? tops.findIndex((l) => new RegExp(`^function\\s+${s.above}\\b`).test(l))
      : tops.findIndex((l, i) => /^function\s/.test(l) && uses.test(tops.slice(i).join('\n').split(/\n}/)[0]))
    const text = s.line(value).split('\n')
    if (fn < 0) lines.push('', ...text)
    else {
      // комментарии прямо над функцией остаются над ней
      while (fn > 0 && /^\s*\/\//.test(lines[fn - 1])) fn--
      lines.splice(fn, 0, ...text, '')
    }
    out[s.tab] = lines.join('\n')
  }
  out[0] = out[0].replace(
    /^loop\(\);\s*$/m,
    '// первый кадр — когда выполнятся все вкладки: их переменные уже будут на месте\nrequestAnimationFrame(loop);',
  )
  return out
}
