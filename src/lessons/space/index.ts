import type { Lesson } from '../types.ts'
import { GUIDE_EXTRAS, GUIDE_INTRO, GUIDE_STEPS } from './guide.ts'
import { SPACE_HINTS } from './hints.ts'
import { ENEMY_PIC, FINISHED, SHIP_PIC, TUTORIAL } from './tabs.ts'

export const SPACE_LESSON: Lesson = {
  id: 'space',
  title: 'Космос',
  card: {
    level: 'Сложно',
    levelBars: 4,
    blurb:
      'Корабль внизу, пробел — стрелять, сверху волнами летят пришельцы. Новое: два массива сразу, цикл в цикле и перезарядка.',
    hero: SHIP_PIC,
    item: ENEMY_PIC,
    heroVar: 'shipPic',
    itemVar: 'enemyPic',
    scene: 'space',
  },
  consoleColor: 'red',
  controls: {
    buttons: [
      { key: 'ArrowLeft', label: 'Влево', icon: 'left' },
      { key: 'ArrowRight', label: 'Вправо', icon: 'right' },
      { key: ' ', label: 'Огонь', icon: 'up', wide: true },
    ],
    keysHint: '← → и пробел',
    hitboxes: 'Показать рамки корабля, пришельцев и пуль и линию прорыва — то, что проверяет checkHits',
  },
  tutorial: TUTORIAL,
  finished: FINISHED,
  intro: GUIDE_INTRO,
  steps: GUIDE_STEPS,
  extras: GUIDE_EXTRAS,
  extrasTitle: 'Взрывы и волны',
  hints: SPACE_HINTS,
}
