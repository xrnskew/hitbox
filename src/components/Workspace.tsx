import { useEffect, useRef, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import type { Toast } from '@/app/controller.ts'
import { Guide } from './Guide.tsx'
import { CloseIcon, ResetIcon, WarnIcon } from './icons.tsx'
import { TabBar } from './TabBar.tsx'
import styles from './Workspace.module.css'

/** Левая колонка — одно окно: сверху вкладки, под ними гайд или код. */
export function Workspace() {
  const c = useController()
  const view = useApp((s) => s.view)

  return (
    <section className={styles.workspace} aria-label="Код" data-view={view === 'guide' ? 'guide' : 'code'}>
      <div className={styles.strip}>
        <TabBar />
        {view !== 'guide' && <NoteBar tab={view} />}
      </div>
      <div className={styles.work}>
        <EditorHost />
        {c.variant.hasGuide && (
          <div className={styles.guide} hidden={view !== 'guide'}>
            <Guide />
          </div>
        )}
        <ToastView />
      </div>
      <ErrorBar />
    </section>
  )
}

function NoteBar({ tab }: { tab: number }) {
  const c = useController()
  const def = c.variant.tabs[tab]
  const engine = tab === 0
  return (
    <div className={styles.note}>
      <p>{def.note}</p>
      <button
        type="button"
        className={engine ? 'key key--sun key--s' : 'key key--s'}
        onClick={() => c.openDialog({ kind: 'reset', tab })}
      >
        <ResetIcon size={13} />
        {engine ? 'Сбросить движок' : 'Сбросить вкладку'}
      </button>
    </div>
  )
}

/** Редактор монтируется один раз; под гайдом он просто скрыт. */
function EditorHost() {
  const c = useController()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current) return
    return c.mountEditor(ref.current)
  }, [c])
  return <div ref={ref} className={styles.editor} />
}

function ToastView() {
  const toast = useApp((s) => s.toast)
  // key — у каждого уведомления свой таймер и своё состояние паузы
  return toast ? <ToastBody key={toast.id} toast={toast} /> : null
}

function ToastBody({ toast }: { toast: Toast }) {
  const c = useController()
  const [paused, setPaused] = useState(false)
  const left = useRef(toast.ms)

  // Пока на уведомление наведена мышь, оно не исчезает: его читают.
  useEffect(() => {
    if (paused) return
    const startedAt = Date.now()
    const t = setTimeout(() => c.dismissToast(), left.current)
    return () => {
      clearTimeout(t)
      left.current -= Date.now() - startedAt
    }
  }, [paused, c])

  return (
    <div
      className={styles.toast}
      role="status"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      <p>{toast.text}</p>
      {toast.undo && (
        <button
          type="button"
          className="key key--sun key--s"
          onClick={() => {
            toast.undo?.()
            c.dismissToast()
            c.focusEditor()
          }}
        >
          Вернуть как было
        </button>
      )}
      <button
        type="button"
        className={`key key--s key--icon ${styles.close}`}
        aria-label="Закрыть"
        onClick={c.dismissToast}
      >
        <CloseIcon size={12} />
      </button>
      <span
        className={styles.countdown}
        style={{ animationDuration: `${toast.ms}ms`, animationPlayState: paused ? 'paused' : 'running' }}
        aria-hidden="true"
      />
    </div>
  )
}

function ErrorBar() {
  const c = useController()
  const error = useApp((s) => s.error)
  if (!error) return null
  // пропуск развилки — не ошибка: та же полоса, но тоном «что дальше» и с клавишей к пропуску
  return (
    <div className={styles.error} data-gap={!!error.gap} role="alert">
      {!error.gap && <WarnIcon className={styles.errorIcon} />}
      <p>{error.text}</p>
      {error.tab !== null && (
        <button type="button" className={error.gap ? 'key key--sun key--s' : 'key key--s'} onClick={c.showError}>
          {error.gap ? 'Показать пропуск' : 'Показать'}
        </button>
      )}
    </div>
  )
}
