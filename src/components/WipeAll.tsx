import { useRef, useState } from 'react'
import { LESSONS } from '@/lessons/index.ts'
import { wipeAll } from '@/sandbox/storage.ts'
import { WarnIcon } from './icons.tsx'
import dialogs from './Dialogs.module.css'

// Временная кнопка в главном меню (просьба пользователя): стереть прогресс всех игр разом.
// От случайного нажатия — код 1001. Окно — нативный <dialog>: Escape и фокус внутри работают сами.

const CODE = '1001'

export function WipeAll({ className }: { className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState('')
  const ok = code.trim() === CODE

  const open = () => {
    setCode('')
    ref.current?.showModal()
    input.current?.focus()
  }
  const close = () => ref.current?.close()

  return (
    <>
      <button type="button" className={`key key--s ${className ?? ''}`} onClick={open}>
        Сбросить всё
      </button>
      <dialog
        ref={ref}
        className={dialogs.dialog}
        aria-labelledby="wipe-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <form
          method="dialog"
          className={dialogs.body}
          onSubmit={(e) => {
            e.preventDefault()
            if (!ok) return
            wipeAll(LESSONS.flatMap((l) => [l.tutorial.storageKey, l.finished.storageKey]))
            location.reload()
          }}
        >
          <h2 id="wipe-title">Сбросить все игры?</h2>
          <p className={dialogs.danger}>
            <WarnIcon size={16} className={dialogs.dangerIcon} />
            <span>
              Пропадёт прогресс <b>всех игр</b>: код во всех вкладках, рекорды и открытая готовая игра. Вернуть его
              будет нельзя.
            </span>
          </p>
          <label className={dialogs.label} htmlFor="wipe-code">
            Чтобы подтвердить, впиши код {CODE}
          </label>
          <input
            ref={input}
            id="wipe-code"
            className={dialogs.input}
            inputMode="numeric"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <div className={dialogs.buttons}>
            <button type="button" className="key" onClick={close}>
              Отмена
            </button>
            <button type="submit" className="key key--danger" disabled={!ok}>
              Сбросить всё
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
