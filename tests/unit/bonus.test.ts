import { describe, expect, it } from 'vitest'
import { currentQuest, levelStates, questChain } from '@/core/levels.ts'
import { findSyntaxError } from '@/core/syntax.ts'
import * as bird from '@/lessons/bird/tabs.ts'
import * as catchTabs from '@/lessons/catch/tabs.ts'
import { LESSONS } from '@/lessons/index.ts'
import { applyPlan, buildAll } from '@/lessons/kit.ts'
import * as space from '@/lessons/space/tabs.ts'
import type { Lesson } from '@/lessons/types.ts'

// Бонусы — квесты, как у шагов: код встаёт кусочками, а где старая строка не годится — кусок её заменяет.
// Проверяем на всех играх: код после всех шагов → куски бонусов по порядку → ровно итоговый код бонусов.

/** Код после всех кусков квестов «собери»: начиная с учебного, вкладка за вкладкой. */
function buildQuests(lesson: Lesson, codes: string[], levels = questChain(lesson)) {
  const out = [...codes]
  for (const q of levels.flatMap((l) => l.quests)) if (q.kind === 'build') out[q.tab] = buildAll(q, out[q.tab])
  return out
}

/** Вкладку шага в учебной версии открывают две строки-заглушки — в итоговом коде их нет. */
const strip = (code: string) => code.replace(/^\/\/ Шаг[^\n]*\n\/\/ Не знаешь[^\n]*\n\n/, '')

const FINAL: Record<string, Record<number, string>> = {
  catch: { 2: catchTabs.GOLD_APPLES, 3: catchTabs.GOLD_CATCH },
  bird: { 3: bird.FAST_PIPES, 4: bird.COIN_HIT },
  space: { 3: space.FAST_ENEMIES, 4: space.BOOM_HITS },
}

describe('бонусы по кусочкам', () => {
  for (const lesson of LESSONS) {
    it(`${lesson.title}: после шагов куски бонусов дают итоговый код, без ошибок`, () => {
      // в Корзинке квест «Десять очков» правят руками — его делаем сами
      const steps = buildQuests(lesson, lesson.tutorial.initial, lesson.steps).map((c) =>
        c.replace('score = score + 1;\n      items.splice', 'score = score + 10;\n      items.splice'),
      )
      const done = buildQuests(lesson, steps, questChain(lesson).slice(lesson.steps.length))
      for (const [tab, code] of Object.entries(FINAL[lesson.id]))
        expect(strip(done[Number(tab)]), `вкладка ${tab}`).toBe(code)
      for (const code of done) expect(findSyntaxError(code)).toBeNull()
      // «Собери и проверь» засчитан, когда запустили собранный код
      for (const x of lesson.extras)
        for (const q of x.quests) if (q.kind === 'run') expect(q.isDone(done), x.title).toBe(true)
    })
  }

  it('Корзинка: где старая строка не годится, кусок её заменяет — «Заменить»', () => {
    const lesson = LESSONS.find((l) => l.id === 'catch')!
    const swaps = lesson.extras.flatMap((x) => x.quests).flatMap((q) => (q.kind === 'build' ? q.pieces : []))
    const steps = buildQuests(lesson, lesson.tutorial.initial, lesson.steps)
    // «Новый предмет — из makeItem»: строка с items.push({ … }) уходит, на её место — items.push(makeItem())
    const make = lesson.extras[0].quests[1]
    if (make.kind !== 'build') throw new Error('ждали квест «собери»')
    let apples = applyPlan(steps[2], make.pieces[0].plan(steps[2])!)
    apples = applyPlan(apples, make.pieces[1].plan(apples)!)
    const plan = make.pieces[2].plan(apples)!
    expect(plan.replace).toBe(1)
    expect(apples.split('\n')[plan.after]).toContain('items.push({ x: Math.random() * 340, y: 0 });')
    expect(swaps.filter((p) => p.plan(steps[2])?.replace).length).toBeGreaterThan(0)
  })

  it('бонус открывается, когда пройдены все шаги: текущий квест — первый квест первого бонуса', () => {
    for (const lesson of LESSONS) {
      const chain = questChain(lesson)
      const n = lesson.steps.length
      const codes = buildQuests(lesson, lesson.tutorial.initial, lesson.steps)
      // шаги ещё не пройдены (квесты «поправь сам») — бонусы закрыты
      expect(
        levelStates(chain, codes)
          .slice(n)
          .map((l) => l.unlocked),
        lesson.id,
      ).toEqual(lesson.extras.map(() => false))
      // те же бонусы за пройденными шагами
      const passed = [...lesson.steps.map((s) => ({ tab: s.tab, fns: [], quests: [] })), ...chain.slice(n)]
      const levels = levelStates(passed, codes, codes)
      expect(
        levels.slice(n).map((l) => l.unlocked),
        lesson.id,
      ).toEqual(lesson.extras.map((_, i) => i === 0))
      expect(currentQuest(passed, levels), lesson.id).toEqual({ step: n, quest: 0 })
    }
  })

  it('Корзинка: бонусы, собранные прежними кнопками, засчитаны — куски не встанут второй раз', () => {
    // так выглядели «Яблоки» и «Поимка» после прежней кнопки «Вставить код» у звезды
    const oldApples = `function makeItem() {
  var r = Math.random();
  var kind = "apple";
  if (r < 0.18) kind = "bomb";
  else if (r < 0.26) kind = "gold";
  return { x: Math.random() * 340, y: 0, kind: kind };
}

function moveItems() {
  frame = frame + 1;
  speedUp();
  if (frame % spawnEvery === 0) {
    items.push(makeItem());
  }
}

function drawItems() {
  for (var i = 0; i < items.length; i++) {
    var pic = itemPic;
    if (items[i].kind === "bomb") pic = bombPic;
    if (items[i].kind === "gold") pic = goldPic;
    drawPic(pic, items[i].x, items[i].y);
  }
}`
    const lesson = LESSONS.find((l) => l.id === 'catch')!
    const codes = [
      `${catchTabs.TUTORIAL_ENGINE}\n${catchTabs.BOMB_LINE}\n${catchTabs.GOLD_LINE}`,
      '',
      oldApples,
      catchTabs.GOLD_CATCH,
    ]
    for (const x of lesson.extras)
      for (const q of x.quests)
        if (q.kind === 'build')
          for (const p of q.pieces) expect(p.isDone(codes[q.tab]), `${x.title}: ${p.title}`).toBe(true)
  })
})
