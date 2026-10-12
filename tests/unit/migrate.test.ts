import { describe, expect, it } from 'vitest'
import { moveSettings } from '@/core/migrate.ts'
import { lessonProgress } from '@/core/levels.ts'
import { LESSONS } from '@/lessons/index.ts'

// Старые сохранения: настройки шагов были в «Движке», а движок звал loop() сразу. При загрузке строка переезжает
// во вкладку шага с тем значением, что поставил ученик, — и прогресс засчитывается, как раньше.

const START =
  '// первый кадр — когда выполнятся все вкладки: их переменные уже будут на месте\nrequestAnimationFrame(loop);'

describe('переезд настроек из «Движка» во вкладки шагов', () => {
  for (const lesson of LESSONS) {
    const v = lesson.tutorial
    const moved = v.moved!
    /** Строка настройки в коде шага: `var name = 0;` или с цветом. */
    const value = (code: string, name: string) => new RegExp(`var\\s+${name}\\s*=\\s*([^;]+);`).exec(code)![1]
    const steps = lesson.steps.map((s) => s.code)

    it(`${lesson.title}: ученик прошёл шаги по-старому — настройки встают на место, шаги засчитаны`, () => {
      expect(moved.length).toBeGreaterThan(0)
      // готовый код шагов со своими значениями: числа 7, цвета и картинки — как в квестах
      const mine = (name: string, code: string) => {
        const was = value(code, name)
        return was.startsWith('"') ? (name.endsWith('Pic') ? '"осьминог"' : '"#ec407a"') : '7'
      }
      const now = [v.initial[0], ...steps]
      for (const s of moved) now[s.tab] = now[s.tab].replace(s.line(s.was), s.line(mine(s.name, now[s.tab])))
      // как было раньше: строки в движке, в шагах их нет, старт — loop();
      const old = [...now]
      old[0] = old[0]
        .replace(
          '// ===== НАСТРОЙКИ =====',
          `// ===== НАСТРОЙКИ =====\n${moved.map((s) => `var ${s.name} = ${value(now[s.tab], s.name)};`).join('\n')}`,
        )
        .replace(START, 'loop();')
      for (const s of moved) old[s.tab] = old[s.tab].replace(`${s.line(value(now[s.tab], s.name))}\n\n`, '')
      expect(old[0]).toContain('loop();')

      const fixed = moveSettings(old, moved)
      expect(fixed).toEqual(now)
      expect(lessonProgress(lesson, fixed).levels.every((l) => l.questsDone.some(Boolean))).toBe(true)
      // второй раз ничего не меняет
      expect(moveSettings(fixed, moved)).toEqual(fixed)
    })

    it(`${lesson.title}: шаг ещё не начат, значение не меняли — строка просто уходит из движка`, () => {
      const old = [...v.initial]
      old[0] = old[0].replace(
        '// ===== НАСТРОЙКИ =====',
        `// ===== НАСТРОЙКИ =====\n${moved.map((s) => `var ${s.name} = ${s.was};`).join('\n')}`,
      )
      expect(moveSettings(old, moved)).toEqual(v.initial)
    })
  }
})
