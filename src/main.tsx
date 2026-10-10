import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/ui.css'
import { createController } from '@/app/controller.ts'
import { readRoute } from '@/app/routes.ts'
import { Home } from '@/components/Home.tsx'
import { LockScreen } from '@/components/LockScreen.tsx'
import { isFinishedUnlocked } from '@/sandbox/storage.ts'
import { CATCH_LESSON } from '@/lessons/catch/index.ts'
import { lessonById } from '@/lessons/index.ts'
import App from '@/App.tsx'

// Без параметров — главное меню с выбором игры. `?game=<id>` — учебная версия игры,
// `?game=<id>&finished` — готовая: своё сохранение, гайда нет, открывается только по паролю.
// Старая ссылка `?finished` без игры открывает готовую Корзинку.
const route = readRoute(CATCH_LESSON.id)
const lesson = route.kind === 'game' ? lessonById(route.id) : null
const finished = route.kind === 'game' && route.finished

const root = createRoot(document.getElementById('root')!)

function start() {
  if (!lesson) return
  // контроллер сразу запускает игру — создаём его только после пароля
  const controller = createController(lesson, finished ? lesson.finished : lesson.tutorial)
  root.render(
    <StrictMode>
      <App controller={controller} />
    </StrictMode>,
  )
}

if (!lesson) {
  // меню; неизвестная игра в адресе — тоже меню
  document.title = 'HitBox — конструктор игр'
  root.render(
    <StrictMode>
      <Home />
    </StrictMode>,
  )
} else {
  document.title = finished ? `HitBox — готовая игра ${lesson.title}` : `HitBox — ${lesson.title}`
  if (finished && !isFinishedUnlocked()) {
    root.render(
      <StrictMode>
        <LockScreen gameId={lesson.id} onUnlock={start} />
      </StrictMode>,
    )
  } else {
    start()
  }
}
