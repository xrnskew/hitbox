import { after, afterBlock, append, decl, has, runQuest, settingPiece, swap } from '../kit.ts'
import type { BuildTask, RunTask, StepTask } from '../types.ts'
import { COIN_DRAW, COIN_GRAB, COIN_LINE, COIN_PUSH, MAX_SPEED_LINE } from './tabs.ts'

// Бонусы Птички — квесты, как у шагов: код встаёт кусочками прямо во вкладках. Начало — код после всех шагов.

// ===== Монетки: картинка → монетка в дырке → схватил — плюс 5 → собрать =====

const COIN_PUSHED = /\bpipes\.push\s*\(\s*\{[^}]*\bcoin\s*:/

export const COIN_PIC_TASK: BuildTask = {
  kind: 'build',
  title: 'Картинка монетки',
  text: 'Монетке нужна своя картинка. Открой «Движок»: строчка встанет к настройкам — жми «Добавить».',
  tab: 0,
  pieces: [settingPiece('Картинка монетки', 'coinPic', COIN_LINE)],
  doneText: 'Картинка есть! Её можно сменить, как картинку птицы.',
}

export const COIN_PIPES_TASK: BuildTask = {
  kind: 'build',
  title: 'Монетка в дырке',
  text: 'У новой трубы в половине случаев появится монетка — `coin: true`. Её рисуем посередине дырки.',
  tab: 3,
  pieces: [
    {
      title: 'У новой трубы — монетка',
      plan: (code) => swap(code, /\bpipes\.push\s*\(\s*\{/, `    pipes.push(${COIN_PUSH});`),
      isDone: (code) => has(code, COIN_PUSHED),
    },
    {
      title: 'Нарисовать монетку',
      plan: (code) => after(code, /\bdrawPipe\s*\(\s*p\.x\s*,\s*p\.top\s*\+\s*pipeGap\b/, COIN_DRAW.slice(1)),
      isDone: (code) => has(code, /\bdrawPic\s*\(\s*coinPic\b/),
    },
  ],
  doneText: 'Монетки висят в дырках! Осталось их хватать.',
}

export const COIN_GRAB_TASK: BuildTask = {
  kind: 'build',
  title: 'Схватил — плюс 5',
  text: 'В `checkHit()`: птица рядом с монеткой — монетка пропадает, а к счёту плюс 5.',
  tab: 4,
  pieces: [
    {
      title: 'Схватил монетку — плюс 5 очков',
      plan: (code) => afterBlock(code, /\bif\s*\(\s*!\s*p\.passed\b/, COIN_GRAB),
      isDone: (code) => has(code, /\bp\.coin\s*=\s*false\b/),
    },
  ],
  doneText: 'Монетки можно хватать! Нажми «Собрать».',
}

export const COIN_RUN_TASK: RunTask = runQuest({
  title: 'Собери и проверь',
  text: 'Нажми «Собрать» и хватай монетки — каждая даёт 5 очков.',
  callout: 'Монетки готовы! Нажми «Собрать».',
  doneText: 'Монетки в игре!',
  after: [COIN_PIC_TASK, COIN_PIPES_TASK, COIN_GRAB_TASK],
})

export const COIN_QUESTS: StepTask[] = [COIN_PIC_TASK, COIN_PIPES_TASK, COIN_GRAB_TASK, COIN_RUN_TASK]

// ===== Всё быстрее: предел скорости → функция speedUp по частям → собрать =====

const FRAME_TICK = /\bframe\s*=\s*frame\s*\+\s*1\s*;/
const SPEEDUP_DECL = decl('speedUp')
const SPEEDUP_IF = /\bif\s*\(\s*frame\s*%\s*600\s*===\s*0\s*&&\s*pipeSpeed\s*<\s*maxSpeed\s*\)\s*\{/
const SPEEDUP_CALL = /(^|[^\w.$])speedUp\s*\(\s*\)\s*;/m

export const MAX_SPEED_TASK: BuildTask = {
  kind: 'build',
  title: 'Предел скорости',
  text: 'Трубы будут ускоряться, но не быстрее `maxSpeed`. Строчка встанет в «Движок».',
  tab: 0,
  pieces: [settingPiece('Предел скорости', 'maxSpeed', MAX_SPEED_LINE)],
  doneText: 'Предел есть! Его можно поменять: больше — труднее.',
}

export const SPEEDUP_TASK: BuildTask = {
  kind: 'build',
  title: 'Всё быстрее',
  text: 'Каждые 10 секунд трубы едут быстрее, но не быстрее `maxSpeed`. Части функции всплывут в «Трубах».',
  tab: 3,
  pieces: [
    {
      title: 'Пустая функция speedUp',
      plan: append('// каждые 10 секунд трубы едут быстрее, но не быстрее maxSpeed\nfunction speedUp() {\n}'),
      isDone: (code) => has(code, SPEEDUP_DECL),
    },
    {
      title: 'Раз в 10 секунд, пока не быстрее maxSpeed',
      plan: (code) => after(code, SPEEDUP_DECL, '  if (frame % 600 === 0 && pipeSpeed < maxSpeed) {\n  }'),
      isDone: (code) => has(code, SPEEDUP_IF),
    },
    {
      title: 'Прибавить скорость',
      plan: (code) => after(code, SPEEDUP_IF, '    pipeSpeed = pipeSpeed + 0.5;'),
      isDone: (code) => has(code, SPEEDUP_IF) && has(code, /\bpipeSpeed\s*=\s*pipeSpeed\s*\+\s*[\d.]+\s*;/),
    },
    {
      title: 'Вызывать каждый кадр в movePipes',
      plan: (code) => (has(code, SPEEDUP_DECL) ? after(code, FRAME_TICK, '  speedUp();') : null),
      isDone: (code) => has(code, SPEEDUP_CALL),
    },
  ],
  doneText: 'Функция собрана! Через 10 секунд трубы поедут быстрее.',
}

export const SPEEDUP_RUN_TASK: RunTask = runQuest({
  title: 'Собери и проверь',
  text: 'Нажми «Собрать» и продержись подольше: трубы будут разгоняться.',
  callout: 'Ускорение готово! Нажми «Собрать».',
  doneText: 'Трубы разгоняются! Игра собрана целиком.',
  after: [MAX_SPEED_TASK, SPEEDUP_TASK],
})

export const SPEEDUP_QUESTS: StepTask[] = [MAX_SPEED_TASK, SPEEDUP_TASK, SPEEDUP_RUN_TASK]
