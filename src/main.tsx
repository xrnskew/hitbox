import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/ui.css'
import { readRoute } from '@/app/routes.ts'
import { Boot } from '@/components/Boot.tsx'
import { Home } from '@/components/Home.tsx'
import { LockScreen } from '@/components/LockScreen.tsx'
import { isFinishedUnlocked } from '@/sandbox/storage.ts'
import { CATCH_LESSON } from '@/lessons/catch/index.ts'
import { lessonById } from '@/lessons/index.ts'

// Без параметров — главное меню с выбором игры. `?game=<id>` — учебная версия игры,
// `?game=<id>&finished` — готовая: своё сохранение, гайда нет, открывается только по паролю.
// Старая ссылка `?finished` без игры открывает готовую Корзинку.
//
// Меню лёгкое: редактор и всё для игры — отдельный кусок (app/game.tsx). Пока он грузится, в #root виден
// экран загрузки из index.html; меню подгружает этот кусок заранее, чтобы переход в игру был быстрым.
const route = readRoute(CATCH_LESSON.id)
const lesson = route.kind === 'game' ? lessonById(route.id) : null
const finished = route.kind === 'game' && route.finished

const root = createRoot(document.getElementById('root')!)
const loadGame = () => import('@/app/game.tsx')

function start() {
  if (!lesson) return
  loadGame().then(
    (m) => m.renderGame(root, lesson, finished),
    () => root.render(<Boot failed />),
  )
}

/** Скачать игру заранее, когда браузер свободен: меню уже нарисовано, ученик выбирает. */
function warmGame() {
  const go = () => void loadGame().catch(() => {})
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 3000 })
  else setTimeout(go, 1500)
}

if (!lesson) {
  // меню; неизвестная игра в адресе — тоже меню
  document.title = 'HitBox — конструктор игр'
  root.render(
    <StrictMode>
      <Home />
    </StrictMode>,
  )
  warmGame()
} else {
  document.title = finished ? `HitBox — готовая игра ${lesson.title}` : `HitBox — ${lesson.title}`
  if (finished && !isFinishedUnlocked()) {
    root.render(
      <StrictMode>
        <LockScreen
          gameId={lesson.id}
          onUnlock={() => {
            root.render(<Boot />)
            start()
          }}
        />
      </StrictMode>,
    )
    warmGame()
  } else {
    // экран загрузки из index.html остаётся, пока не пришла игра
    start()
  }
}
