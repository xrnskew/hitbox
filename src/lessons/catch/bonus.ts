import { stripComments } from '../../core/progress.ts'
import { after, append, before, decl, has, lineOf, runQuest, settingPiece, swap } from '../kit.ts'
import type { BuildTask, InsertPlan, RunTask, StepTask } from '../types.ts'
import { BOMB_LINE, GOLD_LINE } from './tabs.ts'

// Бонусы «Корзинки» — квесты, как у шагов: код встаёт кусочками прямо во вкладках, а где старая строка
// больше не годится — кусок её заменяет («Заменить»). Начало — код после всех шагов: яблоки, ускорение, 10 очков.

// ===== Бомба: картинка → яблоко или бомба → нарисовать → поймал или упустил → собрать =====

const BOMB_KIND = /\bkind\s*=\s*["']bomb["']/
const PIC_BOMB = /\bif\s*\(\s*items\[i\]\.kind\s*===\s*["']bomb["']\s*\)\s*pic\s*=\s*bombPic\b/
const CAUGHT_BOMB = /\bif\s*\(\s*items\[i\]\.kind\s*===\s*["']bomb["']\s*\)\s*\{/
const MISSED_APPLE = /\bif\s*\(\s*items\[i\]\.kind\s*===\s*["']apple["']\s*\)\s*lives\s*=\s*lives\s*-\s*1\b/

/** Строка `re`, а если над ней комментарий, который она объясняет (`// поймал…`), — вместе с ним. */
function swapWithComment(code: string, re: RegExp, comment: RegExp, text: string, from = 0): InsertPlan | null {
  const lines = stripComments(code).split('\n')
  const raw = code.split('\n')
  const line = lines.findIndex((l, i) => i >= from && re.test(l)) + 1
  if (!line) return null
  const commented = line > 1 && comment.test(raw[line - 2])
  return { after: commented ? line - 2 : line - 1, text, replace: commented ? 2 : 1 }
}

export const BOMB_PIC_TASK: BuildTask = {
  kind: 'build',
  title: 'Картинка бомбы',
  text: 'Бомбе нужна своя картинка. Открой «Движок»: строчка встанет к остальным настройкам — жми «Добавить».',
  tab: 0,
  pieces: [settingPiece('Картинка бомбы', 'bombPic', BOMB_LINE)],
  doneText: 'Картинка есть! Её можно сменить, как картинку героя.',
}

export const BOMB_MAKE_TASK: BuildTask = {
  kind: 'build',
  title: 'Яблоко или бомба',
  text: 'Новый предмет теперь делает функция `makeItem()`: обычно яблоко, а иногда — бомба. Собери её в «Яблоках».',
  tab: 2,
  pieces: [
    {
      title: 'Функция makeItem: новое яблоко',
      plan: append(
        '// новый предмет: обычно яблоко, иногда бомба\nfunction makeItem() {\n  var kind = "apple";\n  return { x: Math.random() * 340, y: 0, kind: kind };\n}',
      ),
      isDone: (code) => has(code, decl('makeItem')),
    },
    {
      title: 'Иногда — бомба',
      plan: (code) => after(code, /\bvar\s+kind\s*=\s*["']apple["']/, '  if (Math.random() < 0.2) kind = "bomb";'),
      isDone: (code) => has(code, BOMB_KIND),
    },
    {
      title: 'Новый предмет — из makeItem',
      plan: (code) => swap(code, /\bitems\.push\s*\(\s*\{/, '    items.push(makeItem());'),
      isDone: (code) => has(code, /\bitems\.push\s*\(\s*makeItem\s*\(\s*\)\s*\)/),
    },
  ],
  doneText: 'Теперь иногда падает бомба — но пока она выглядит как яблоко. Дальше её нарисуем.',
}

export const BOMB_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Нарисуй бомбу',
  text: 'В `drawItems()` выбираем картинку: у бомбы — `bombPic`, у остальных — `itemPic`.',
  tab: 2,
  pieces: [
    {
      title: 'Какую картинку рисовать',
      plan: (code) =>
        before(
          code,
          /\bdrawPic\s*\(\s*itemPic\s*,\s*items\[i\]/,
          '    var pic = itemPic;\n    if (items[i].kind === "bomb") pic = bombPic;',
        ),
      isDone: (code) => has(code, PIC_BOMB),
    },
    {
      title: 'Рисовать выбранную картинку',
      plan: (code) =>
        has(code, PIC_BOMB)
          ? swap(code, /\bdrawPic\s*\(\s*itemPic\s*,\s*items\[i\]/, '    drawPic(pic, items[i].x, items[i].y);')
          : null,
      isDone: (code) => has(code, /\bdrawPic\s*\(\s*pic\s*,\s*items\[i\]/),
    },
  ],
  doneText: 'Бомбу видно! Осталось решить, что будет, если её поймать.',
}

export const BOMB_CATCH_TASK: BuildTask = {
  kind: 'build',
  title: 'Бомба — минус жизнь',
  text: 'В `checkCatch()`: поймал бомбу — минус жизнь, а упустил — не страшно. Старые строки уступят место новым — жми «Заменить».',
  tab: 3,
  pieces: [
    {
      title: 'Поймал бомбу — минус жизнь',
      plan: (code) =>
        swapWithComment(
          code,
          /\bscore\s*(=\s*score\s*\+|\+=)/,
          /^\s*\/\/\s*поймал/,
          '      if (items[i].kind === "bomb") {\n        // поймал бомбу — минус жизнь\n        lives = lives - 1;\n      } else {\n        // поймал яблоко — десять очков\n        score = score + 10;\n      }',
        ),
      isDone: (code) => has(code, CAUGHT_BOMB),
    },
    {
      title: 'Упустил бомбу — не страшно',
      plan: (code) => {
        // минус жизнь в ветке «уронил» — первая после `else if (… > 500)`
        const from = lineOf(code, /\belse\s+if\s*\(\s*items\[i\]\.y\s*>\s*500\b/)
        return from
          ? swapWithComment(
              code,
              /\blives\s*=\s*lives\s*-\s*1\b/,
              /^\s*\/\/\s*уронил/,
              '      // уронил яблоко — минус жизнь, а бомбу упустить не страшно\n      if (items[i].kind === "apple") lives = lives - 1;',
              from,
            )
          : null
      },
      isDone: (code) => has(code, MISSED_APPLE),
    },
  ],
  doneText: 'Бомба опасна только в руках! Нажми «Собрать» и проверь.',
}

export const BOMB_RUN_TASK: RunTask = runQuest({
  title: 'Собери и проверь',
  text: 'Нажми «Собрать» и лови яблоки, а от бомб уворачивайся.',
  callout: 'Бомба готова! Нажми «Собрать» — и уворачивайся.',
  doneText: 'Бомба в игре!',
  after: [BOMB_PIC_TASK, BOMB_MAKE_TASK, BOMB_DRAW_TASK, BOMB_CATCH_TASK],
})

export const BOMB_QUESTS: StepTask[] = [BOMB_PIC_TASK, BOMB_MAKE_TASK, BOMB_DRAW_TASK, BOMB_CATCH_TASK, BOMB_RUN_TASK]

// ===== Звезда: картинка → иногда звезда → нарисовать → поймал — плюс жизнь → собрать =====

const GOLD_KIND = /\bkind\s*=\s*["']gold["']/
const CAUGHT_GOLD = /\bif\s*\(\s*items\[i\]\.kind\s*===\s*["']gold["']\s*\)\s*\{/

export const GOLD_PIC_TASK: BuildTask = {
  kind: 'build',
  title: 'Картинка звезды',
  text: 'Звезде тоже нужна картинка — строчка встанет в «Движок».',
  tab: 0,
  pieces: [settingPiece('Картинка звезды', 'goldPic', GOLD_LINE)],
  doneText: 'Картинка звезды есть!',
}

export const GOLD_MAKE_TASK: BuildTask = {
  kind: 'build',
  title: 'Иногда — звезда',
  text: 'В `makeItem()`: если не бомба, то иногда — звезда.',
  tab: 2,
  pieces: [
    {
      title: 'Если не бомба — иногда звезда',
      plan: (code) => after(code, BOMB_KIND, '  else if (Math.random() < 0.1) kind = "gold";'),
      isDone: (code) => has(code, GOLD_KIND),
    },
  ],
  doneText: 'Звёзды падают! Пока они похожи на яблоки — нарисуем.',
}

export const GOLD_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Нарисуй звезду',
  text: 'В `drawItems()` у звезды своя картинка — `goldPic`.',
  tab: 2,
  pieces: [
    {
      title: 'У звезды — картинка звезды',
      plan: (code) => after(code, PIC_BOMB, '    if (items[i].kind === "gold") pic = goldPic;'),
      isDone: (code) => has(code, /\bif\s*\(\s*items\[i\]\.kind\s*===\s*["']gold["']\s*\)\s*pic\s*=\s*goldPic\b/),
    },
  ],
  doneText: 'Звезду видно!',
}

export const GOLD_CATCH_TASK: BuildTask = {
  kind: 'build',
  title: 'Звезда — плюс жизнь',
  text: 'В `checkCatch()`: поймал звезду — плюс жизнь. Упустить её не страшно — это уже так: жизнь отнимает только яблоко.',
  tab: 3,
  pieces: [
    {
      title: 'Поймал звезду — плюс жизнь',
      plan: (code) => {
        // `} else {` сразу после ветки бомбы
        const from = lineOf(code, CAUGHT_BOMB)
        if (!from) return null
        const lines = stripComments(code).split('\n')
        const i = lines.findIndex((l, n) => n >= from && /^\s*\}\s*else\s*\{\s*$/.test(l))
        return i < 0
          ? null
          : {
              after: i,
              replace: 1,
              text: '      } else if (items[i].kind === "gold") {\n        // поймал звезду — плюс жизнь\n        lives = lives + 1;\n      } else {',
            }
      },
      isDone: (code) => has(code, CAUGHT_GOLD),
    },
  ],
  doneText: 'Звезда спасает! Нажми «Собрать».',
}

export const GOLD_RUN_TASK: RunTask = runQuest({
  title: 'Собери и проверь',
  text: 'Нажми «Собрать»: лови яблоки и звёзды, уворачивайся от бомб.',
  callout: 'Звезда готова! Нажми «Собрать».',
  doneText: 'Звезда в игре! Игра собрана целиком.',
  after: [GOLD_PIC_TASK, GOLD_MAKE_TASK, GOLD_DRAW_TASK, GOLD_CATCH_TASK],
})

export const GOLD_QUESTS: StepTask[] = [GOLD_PIC_TASK, GOLD_MAKE_TASK, GOLD_DRAW_TASK, GOLD_CATCH_TASK, GOLD_RUN_TASK]
