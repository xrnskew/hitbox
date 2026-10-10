import { parse } from 'acorn'
import { describe, expect, it } from 'vitest'
import { explainRuntimeError, explainSyntax, formatError } from '@/core/errors.ts'
import { applySettingInsert, planSettingInsert } from '@/core/insert.ts'
import { functionState, hasContent, partDone, stepDone, stripComments } from '@/core/progress.ts'
import { createRunner } from '@/core/runner.ts'
import { findSyntaxError, firstSyntaxError, scanBrackets } from '@/core/syntax.ts'
import { GUIDE_STEPS } from '@/lessons/catch/guide.ts'
import {
  BOMB_APPLES,
  BOMB_CATCH,
  BOMB_LINE,
  GOLD_APPLES,
  GOLD_CATCH,
  FINISHED_CODES,
  STEP_CATCH,
  STEP_HERO,
  TUTORIAL_CODES,
  TUTORIAL_ENGINE,
} from '@/lessons/catch/tabs.ts'
import runtime from '@/sandbox/runtime.js?raw'

describe('синтаксис', () => {
  const allCode = [
    ...TUTORIAL_CODES,
    ...FINISHED_CODES,
    ...GUIDE_STEPS.map((s) => s.code),
    BOMB_LINE,
    BOMB_APPLES,
    BOMB_CATCH,
    GOLD_APPLES,
    GOLD_CATCH,
  ]

  it('весь готовый код без ошибок', () => {
    for (const code of allCode) expect(findSyntaxError(code)).toBeNull()
  })

  it('незакрытая { цикла — ошибка на строке цикла', () => {
    const lines = STEP_CATCH.split('\n')
    lines.splice(lines.length - 2, 1) // удаляем } цикла for
    const issue = findSyntaxError(lines.join('\n'))
    expect(issue?.line).toBe(2)
    expect(issue?.message).toBe('скобка { открыта, но не закрыта — не хватает }')
  })

  it('незакрытая { функции в конце вкладки', () => {
    // строка 8 — `function movePlayer() {`, у которой нет закрывающей }
    const issue = findSyntaxError(STEP_HERO.replace(/\}$/, ''))
    expect(issue?.line).toBe(8)
    expect(issue?.message).toMatch(/открыта, но не закрыта/)
  })

  it('лишняя }', () => {
    const issue = findSyntaxError('function a() {\n  b();\n}\n}')
    expect(issue).toMatchObject({ line: 4, message: 'лишняя скобка } — её нечему закрывать' })
  })

  it('незакрытая кавычка', () => {
    const issue = findSyntaxError('function a() {\n  ctx.fillText("Счёт, 12, 26);\n}')
    expect(issue?.line).toBe(2)
    expect(issue?.message).toMatch(/не закрыта кавычка/)
  })

  it('что-то лишнее', () => {
    expect(findSyntaxError('if (x > ) {}')?.message).toBe('здесь что-то лишнее или чего-то не хватает')
  })

  it('символы, которые печатают вместо операторов', () => {
    expect(findSyntaxError('if (a ≥ b) {}')?.message).toBe('символ ≥ JavaScript не понимает — пиши >=')
    expect(findSyntaxError('var s = «да»;')?.message).toMatch(/кавычки « не подходят/)
  })

  it('сканер не путается в регулярках, шаблонах и комментариях', () => {
    expect(scanBrackets('var r = /[{(]/g; var d = a / b;')).toBeNull()
    expect(scanBrackets('var s = `a ${b} { ${"}"}`;')).toBeNull()
    expect(scanBrackets('// {\n/* ( */ var x = "[";')).toBeNull()
  })

  it('первая вкладка с ошибкой по порядку склейки', () => {
    expect(firstSyntaxError(['var a = 1;', 'if (', 'var b = ;'])).toMatchObject({ tab: 1 })
    expect(firstSyntaxError(TUTORIAL_CODES)).toBeNull()
  })
})

describe('склейка и карта строк', () => {
  const runner = createRunner(runtime)
  const codes = ['var a = 1;\nvar MARK_A = 2;', '// x', 'function f() {\n  MARK_C();\n}']
  const doc = runner.buildDoc(codes, { focus: true, hitboxes: false, game: 'catch' })
  const lines = doc.split('\n')
  const lineOf = (marker: string) => lines.findIndex((l) => l.includes(marker)) + 1

  it('код начинается сразу после обвязки', () => {
    expect(lines[runner.headerLines]).toBe(codes[0].split('\n')[0])
  })

  it('locate возвращает вкладку и строку', () => {
    expect(runner.locate(lineOf('MARK_A'), codes)).toEqual({ tab: 0, line: 2 })
    expect(runner.locate(lineOf('MARK_C'), codes)).toEqual({ tab: 2, line: 2 })
    expect(runner.locate(3, codes)).toBeNull()
    expect(runner.locate(lines.length + 5, codes)).toBeNull()
  })

  it('без фокуса число строк обвязки то же', () => {
    const noFocus = runner.buildDoc(codes, { focus: false, hitboxes: false, game: 'catch' }).split('\n')
    expect(noFocus.length).toBe(lines.length)
    expect(noFocus[runner.headerLines]).toBe(codes[0].split('\n')[0])
  })

  it('оба скрипта — корректный JavaScript', () => {
    const scripts = [...doc.matchAll(/<script>\n([\s\S]*?)\n<\/script>/g)].map((m) => m[1])
    expect(scripts).toHaveLength(2)
    for (const s of scripts) expect(() => parse(s, { ecmaVersion: 'latest', sourceType: 'script' })).not.toThrow()
  })

  it('</script> в строке ученика не обрывает документ', () => {
    const d = runner.buildDoc(['console.log("</script>");'], { focus: true, hitboxes: false, game: 'catch' })
    expect(d.match(/<\/script>/g)).toHaveLength(2)
  })
})

describe('переводы ошибок', () => {
  it('во время выполнения: перевод и оригинал в скобках', () => {
    expect(explainRuntimeError('Uncaught ReferenceError: drawBasket is not defined')).toBe(
      'drawBasket не найдено — проверь, нет ли опечатки в имени (ReferenceError: drawBasket is not defined)',
    )
    expect(explainRuntimeError('TypeError: score is not a function')).toMatch(/^score — не функция/)
    expect(explainRuntimeError("TypeError: Cannot read properties of undefined (reading 'y')")).toMatch(
      /^нельзя взять \.y у пустого значения undefined \(/,
    )
    expect(explainRuntimeError("SyntaxError: Identifier 'a' has already been declared")).toMatch(
      /^имя a уже объявлено в другой вкладке или выше/,
    )
    expect(explainRuntimeError('Error: что-то своё')).toBe('Error: что-то своё')
  })

  it('синтаксис: без координат acorn', () => {
    expect(explainSyntax('Unexpected token (3:5)')).toBe('здесь что-то лишнее или чего-то не хватает')
  })

  it('формат сообщения', () => {
    expect(formatError({ title: 'Поимка', line: 3 }, 'x')).toBe('Ошибка во вкладке «Поимка», строка 3: x')
    expect(formatError(null, 'x')).toBe('Ошибка: x')
  })
})

describe('прогресс', () => {
  it('пустые вкладки — только комментарии', () => {
    expect(TUTORIAL_CODES.slice(1).some(hasContent)).toBe(false)
    expect(hasContent('/* a */\n\n// b')).toBe(false)
    expect(hasContent('// a\nx();')).toBe(true)
  })

  it('stripComments сохраняет длину и не трогает строки', () => {
    const src = 'var a = "// не комментарий"; // комментарий\n/* x\ny */ b();'
    const out = stripComments(src)
    expect(out.length).toBe(src.length)
    expect(out).toContain('"// не комментарий"')
    expect(out).not.toContain('комментарий\n')
  })

  it('шаг сделан, только когда все функции не пустые', () => {
    expect(stepDone(STEP_HERO, ['movePlayer', 'drawPlayer'])).toBe(true)
    expect(functionState('function movePlayer() {}', 'movePlayer')).toBe('empty')
    expect(functionState('function movePlayer() {\n  // потом\n}', 'movePlayer')).toBe('empty')
    expect(functionState('// function movePlayer() { x(); }', 'movePlayer')).toBe('missing')
    expect(stepDone('function movePlayer() { x(); }', ['movePlayer', 'drawPlayer'])).toBe(false)
    for (const s of GUIDE_STEPS) expect(stepDone(s.code, s.fns)).toBe(true)
    // в движке заготовки пустые
    expect(stepDone(TUTORIAL_ENGINE, ['movePlayer'])).toBe(false)
  })

  it('бомбу узнаём по признакам: в коде шага их нет', () => {
    expect(partDone(BOMB_CATCH, [/["']bomb["']/])).toBe(true)
    expect(partDone(STEP_CATCH, [/["']bomb["']/])).toBe(false)
  })
})

describe('строка настройки в «Движке»', () => {
  it('встаёт после последнего …Emoji', () => {
    const plan = planSettingInsert(TUTORIAL_ENGINE, 'bombPic', BOMB_LINE)
    expect(plan).toEqual({ kind: 'insert', after: 5, text: BOMB_LINE })
    const next = applySettingInsert(TUTORIAL_ENGINE, plan)
    expect(next.split('\n')[5]).toBe(BOMB_LINE)
    expect(planSettingInsert(next, 'bombPic', BOMB_LINE)).toEqual({ kind: 'exists', line: 6 })
  })

  it('без эмодзи — после заголовка настроек, без заголовка — в начало', () => {
    expect(planSettingInsert('// ===== НАСТРОЙКИ =====\nvar a = 1;', 'bombPic', BOMB_LINE)).toMatchObject({
      after: 1,
    })
    expect(planSettingInsert('var a = 1;', 'bombPic', BOMB_LINE)).toMatchObject({ after: 0 })
  })

  it('закомментированная переменная не считается', () => {
    expect(planSettingInsert(`// ${BOMB_LINE}\n`, 'bombPic', BOMB_LINE).kind).toBe('insert')
  })
})
