import { expect } from 'vitest'
import { applySettingInsert, planSettingInsert } from '@/core/insert.ts'
import { findSyntaxError } from '@/core/syntax.ts'
import { findGaps } from '@/core/gaps.ts'
import { choose } from '@/lessons/kit.ts'
import type { BuildTask, InsertPlan } from '@/lessons/types.ts'

// Сборка по кусочкам без редактора и строка настройки в «Движок» — общие для квестов всех игр.

/** То же, что делает редактор: вставить текст после строки plan.after. */
export function apply(code: string, plan: InsertPlan): string {
  const lines = code.split('\n')
  lines.splice(plan.after, 0, ...plan.text.split('\n'))
  return lines.join('\n')
}

/**
 * Собрать все части по порядку, как кнопками «Добавить»; в развилке — выбрать верный вариант.
 * Каждая промежуточная версия — без ошибок.
 */
export function build(code: string, ...tasks: BuildTask[]): string {
  for (const task of tasks)
    for (const piece of task.pieces) {
      expect(piece.isDone(code), piece.title).toBe(false)
      const plan = piece.plan(code)
      expect(plan, piece.title).not.toBeNull()
      code = apply(code, plan!)
      if (piece.choice) {
        // кусок встал с пропуском: пока вариант не выбран, кусок не засчитан и второй раз не всплывает
        expect(findGaps(code), piece.title).toHaveLength(1)
        expect(piece.isDone(code), piece.title).toBe(false)
        expect(piece.plan(code), piece.title).toBeNull()
        code = choose(piece, code)
      }
      expect(piece.isDone(code), piece.title).toBe(true)
      expect(findSyntaxError(code), piece.title).toBeNull()
    }
  return code
}

/** То же, что кнопка «Добавить переменную в «Движок»» в дополнительном задании. */
export const withSetting = (engine: string, name: string, line: string) =>
  applySettingInsert(engine, planSettingInsert(engine, name, line))

// Настройки шагов (скорости, гравитация, цвета) живут во вкладках шагов. Проверкам удобно задавать их разом:
// движок с пометкой → tune расставит значения в строки `var name = …;` там, где настройка объявлена.

const TUNE = '// значения настроек для проверки: '

/** Движок с пометкой, какие значения поставить настройкам. Значение — текст JS: `6`, `"#ec407a"`. */
export const withTune = (engine: string, vars: Record<string, string | number>) =>
  `${engine}\n${TUNE}${JSON.stringify(vars)}`

/** Код вкладок с настройками из пометки в движке: значение встаёт там, где настройка объявлена. */
export function tune(codes: string[]): string[] {
  const at = codes[0]?.lastIndexOf(TUNE) ?? -1
  if (at < 0) return codes
  const vars: Record<string, string | number> = JSON.parse(codes[0].slice(at + TUNE.length).split('\n')[0])
  return codes.map((code) =>
    Object.entries(vars).reduce(
      (c, [name, value]) => c.replace(new RegExp(`^(\\s*var\\s+${name}\\s*=\\s*)[^;\\n]*;`, 'm'), `$1${value};`),
      code,
    ),
  )
}
