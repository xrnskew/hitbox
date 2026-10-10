import { StrictMode } from 'react'
import type { Root } from 'react-dom/client'
import App from '@/App.tsx'
import type { Lesson } from '@/lessons/types.ts'
import { createController } from './controller.ts'

// Игра — отдельный кусок сборки: редактор (CodeMirror), разбор кода (acorn) и обвязка игры. Меню их не грузит,
// а подгружает этот кусок заранее, пока ученик выбирает игру (main.tsx).

export function renderGame(root: Root, lesson: Lesson, finished: boolean) {
  // контроллер сразу запускает игру
  const controller = createController(lesson, finished ? lesson.finished : lesson.tutorial)
  root.render(
    <StrictMode>
      <App controller={controller} />
    </StrictMode>,
  )
}
