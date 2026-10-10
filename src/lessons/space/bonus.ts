import { after, has, into, runQuest, settingPiece } from '../kit.ts'
import type { BuildTask, RunTask, StepTask } from '../types.ts'
import { BOOM_LINE, MAX_SPEED_LINE } from './tabs.ts'

// Бонусы Космоса — квесты, как у шагов: код встаёт кусочками прямо во вкладках. Начало — код после всех шагов.

// ===== Взрывы: картинка → взрыв на месте пришельца → горят и гаснут → собрать =====

const BOOM_DRAWN = /\bdrawPic\s*\(\s*boomPic\b/

export const BOOM_PIC_TASK: BuildTask = {
  kind: 'build',
  title: 'Картинка взрыва',
  text: 'Взрыву нужна своя картинка. Открой «Движок»: строчка встанет к настройкам — жми «Добавить».',
  tab: 0,
  pieces: [settingPiece('Картинка взрыва', 'boomPic', BOOM_LINE)],
  doneText: 'Картинка есть! Её можно сменить.',
}

export const BOOM_PUSH_TASK: BuildTask = {
  kind: 'build',
  title: 'Взрыв на месте пришельца',
  text: 'Сбил пришельца — в третий массив `booms` попадает взрыв: где он и сколько кадров ещё гореть.',
  tab: 4,
  pieces: [
    {
      title: 'На месте пришельца — взрыв',
      plan: (code) =>
        after(
          code,
          /\bscore\s*(=\s*score\s*\+|\+=)\s*\d+\s*;/,
          '        // на месте пришельца — взрыв\n        booms.push({ x: a.x, y: a.y, t: 20 });',
        ),
      isDone: (code) => has(code, /\bbooms\.push\s*\(/),
    },
  ],
  doneText: 'Взрывы появляются! Пока их не видно — нарисуем.',
}

export const BOOM_DRAW_TASK: BuildTask = {
  kind: 'build',
  title: 'Взрывы горят и гаснут',
  text: 'В `drawEnemies()`: рисуем каждый взрыв, а через 20 кадров он гаснет.',
  tab: 3,
  pieces: [
    {
      title: 'Нарисовать каждый взрыв',
      plan: into(
        'drawEnemies',
        '\n  // взрывы горят 20 кадров и гаснут\n  for (var i = booms.length - 1; i >= 0; i--) {\n    drawPic(boomPic, booms[i].x, booms[i].y);\n  }',
      ),
      isDone: (code) => has(code, BOOM_DRAWN),
    },
    {
      title: 'Через 20 кадров — погас',
      plan: (code) =>
        after(code, BOOM_DRAWN, '    booms[i].t = booms[i].t - 1;\n    if (booms[i].t <= 0) booms.splice(i, 1);'),
      isDone: (code) => has(code, /\bbooms\.splice\s*\(/),
    },
  ],
  doneText: 'Взрывы горят! Нажми «Собрать» и сбей кого-нибудь.',
}

export const BOOM_RUN_TASK: RunTask = runQuest({
  title: 'Собери и проверь',
  text: 'Нажми «Собрать» и сбей пришельца — на его месте вспыхнет взрыв.',
  callout: 'Взрывы готовы! Нажми «Собрать».',
  doneText: 'Взрывы в игре!',
  after: [BOOM_PIC_TASK, BOOM_PUSH_TASK, BOOM_DRAW_TASK],
})

export const BOOM_QUESTS: StepTask[] = [BOOM_PIC_TASK, BOOM_PUSH_TASK, BOOM_DRAW_TASK, BOOM_RUN_TASK]

// ===== Волна за волной: предел скорости → каждая волна больше и быстрее → собрать =====

const WAVE_TICK = /\bwave\s*=\s*wave\s*\+\s*1\s*;/
const FAST_IF = /\bif\s*\(\s*wave\s*>\s*1\s*&&\s*enemySpeed\s*<\s*maxSpeed\s*\)\s*\{/
const FASTER = /\benemySpeed\s*=\s*enemySpeed\s*\+\s*[\d.]+\s*;/

export const MAX_SPEED_TASK: BuildTask = {
  kind: 'build',
  title: 'Предел скорости',
  text: 'Пришельцы будут ускоряться, но не быстрее `maxSpeed`. Строчка встанет в «Движок».',
  tab: 0,
  pieces: [settingPiece('Предел скорости', 'maxSpeed', MAX_SPEED_LINE)],
  doneText: 'Предел есть! Его можно поменять: больше — труднее.',
}

export const WAVES_TASK: BuildTask = {
  kind: 'build',
  title: 'Больше и быстрее',
  text: 'В `moveEnemies()`: каждая новая волна на одного пришельца больше и быстрее прошлой — пока не упрётся в `maxSpeed`.',
  tab: 3,
  pieces: [
    {
      title: 'Новая волна, пока не быстрее maxSpeed',
      plan: (code) =>
        after(
          code,
          WAVE_TICK,
          '\n    // каждая новая волна больше и быстрее, но не быстрее maxSpeed\n    if (wave > 1 && enemySpeed < maxSpeed) {\n    }\n',
        ),
      isDone: (code) => has(code, FAST_IF),
    },
    {
      title: 'Быстрее',
      plan: (code) => after(code, FAST_IF, '      enemySpeed = enemySpeed + 0.25;'),
      isDone: (code) => has(code, FAST_IF) && has(code, FASTER),
    },
    {
      title: 'На одного больше',
      plan: (code) => after(code, FASTER, '      waveSize = waveSize + 1;'),
      isDone: (code) => has(code, /\bwaveSize\s*=\s*waveSize\s*\+\s*1\s*;/),
    },
  ],
  doneText: 'Волны растут! Нажми «Собрать» и продержись подольше.',
}

export const WAVES_RUN_TASK: RunTask = runQuest({
  title: 'Собери и проверь',
  text: 'Нажми «Собрать»: с каждой волной пришельцев больше и они быстрее.',
  callout: 'Волны готовы! Нажми «Собрать».',
  doneText: 'Волна за волной! Игра собрана целиком.',
  after: [MAX_SPEED_TASK, WAVES_TASK],
})

export const WAVES_QUESTS: StepTask[] = [MAX_SPEED_TASK, WAVES_TASK, WAVES_RUN_TASK]
