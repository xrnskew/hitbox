import { LogoCube } from './icons.tsx'

// Экран загрузки. Тот же, что лежит в index.html и виден, пока не пришли скрипты: кубик и дорожка из плиток,
// которая заполняется жёлтым, как дорога на карте гайда. Стили — тоже в index.html (классы boot-*).
// Здесь он нужен, когда игру грузим уже из React: после пароля готовой игры — и если загрузка не удалась.

export function Boot({ failed = false }: { failed?: boolean }) {
  return (
    <div className="boot" data-failed={failed || undefined} role={failed ? 'alert' : 'status'}>
      <LogoCube className="boot-cube" />
      {!failed && (
        <div className="boot-road" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      )}
      <p className="boot-text">
        {failed ? 'Игра не загрузилась. Проверь интернет и обнови страницу.' : 'Загружаем игру…'}
      </p>
      {failed && (
        <button type="button" className="key key--l" onClick={() => location.reload()}>
          Обновить страницу
        </button>
      )}
    </div>
  )
}
