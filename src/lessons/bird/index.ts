import type { Lesson } from '../types.ts'
import { GUIDE_EXTRAS, GUIDE_INTRO, GUIDE_STEPS } from './guide.ts'
import { BIRD_HINTS } from './hints.ts'
import { BIRD_PIC, FINISHED, TUTORIAL } from './tabs.ts'

export const BIRD_LESSON: Lesson = {
  id: 'bird',
  title: 'Птичка',
  card: {
    level: 'Легко',
    levelBars: 2,
    blurb:
      'Птица падает, пробел — взмах, навстречу едут трубы с дыркой. Новое: у птицы есть скорость, и гравитация меняет её каждый кадр.',
    hero: BIRD_PIC,
    heroVar: 'birdPic',
    scene: 'bird',
  },
  consoleColor: 'green',
  controls: {
    buttons: [{ key: ' ', label: 'Взмах', icon: 'up', wide: true }],
    keysHint: 'пробел',
    hitboxes: 'Показать рамку птицы, трубы и низ экрана — то, что проверяет checkHit',
  },
  tutorial: TUTORIAL,
  finished: FINISHED,
  intro: GUIDE_INTRO,
  steps: GUIDE_STEPS,
  extras: GUIDE_EXTRAS,
  extrasTitle: 'Монетки и скорость',
  hints: BIRD_HINTS,
}
