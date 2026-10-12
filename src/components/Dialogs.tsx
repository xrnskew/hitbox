import { type ReactNode, type RefObject, useEffect, useRef, useState } from 'react'
import { useApp, useController } from '@/app/context.ts'
import { WarnIcon } from './icons.tsx'
import styles from './Dialogs.module.css'

/** Нативный <dialog> + showModal(): Escape и фокус внутри окна работают сами. */
function Modal({
  title,
  children,
  dialogRef,
  initialFocus,
}: {
  title: string
  children: ReactNode
  dialogRef: RefObject<HTMLDialogElement | null>
  initialFocus?: RefObject<HTMLElement | null>
}) {
  const c = useController()

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (!d.open) d.showModal()
    initialFocus?.current?.focus()
  }, [dialogRef, initialFocus])

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="dialog-title"
      onClose={() => {
        c.closeDialog()
        c.afterDialog()
      }}
      // клик по фону закрывает окно
      onClick={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.close()
      }}
    >
      <div className={styles.body}>
        <h2 id="dialog-title">{title}</h2>
        {children}
      </div>
    </dialog>
  )
}

/** Окно и функция, которая его закрывает. */
function useDialog() {
  const ref = useRef<HTMLDialogElement>(null)
  return { ref, close: () => ref.current?.close() }
}

function ResetDialog({ tab }: { tab: number }) {
  const c = useController()
  const engine = tab === 0
  const cancel = useRef<HTMLButtonElement>(null)
  const confirm = useRef<HTMLButtonElement>(null)
  const title = c.variant.tabs[tab].title
  const { ref, close } = useDialog()

  return (
    <Modal
      title={engine ? 'Сбросить движок?' : `Сбросить вкладку «${title}»?`}
      dialogRef={ref}
      initialFocus={engine ? cancel : confirm}
    >
      {engine ? (
        <p className={styles.warn}>
          <WarnIcon size={16} className={styles.warnIcon} />
          <span>
            <b>Всё, что ты поменял в «Движке», пропадёт:</b> картинки, числа и свой код. Остальные вкладки — со
            скоростями и цветами шагов — останутся как есть.
          </span>
        </p>
      ) : (
        <p>
          Код в этой вкладке вернётся к началу — вместе с её настройками. Другие вкладки и «Движок» останутся как есть.
        </p>
      )}
      <p className={styles.note}>
        Передумаешь — нажми <kbd>Ctrl</kbd>+<kbd>Z</kbd>.
      </p>
      <div className={styles.buttons}>
        <button ref={cancel} type="button" className="key" onClick={close}>
          Отмена
        </button>
        <button
          ref={confirm}
          type="button"
          className={engine ? 'key key--sun' : 'key key--light'}
          onClick={() => {
            c.confirmReset(tab)
            close()
          }}
        >
          {engine ? 'Сбросить движок' : 'Сбросить вкладку'}
        </button>
      </div>
    </Modal>
  )
}

const RESET_WORD = 'сброс'

function ResetAllDialog() {
  const c = useController()
  const [word, setWord] = useState('')
  const input = useRef<HTMLInputElement>(null)
  // Защита от случайного клика: кнопка неактивна, пока не вписано слово.
  const ok = word.trim().toLowerCase() === RESET_WORD
  const { ref, close } = useDialog()

  return (
    <Modal title="Сбросить весь код?" dialogRef={ref} initialFocus={input}>
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault()
          if (!ok) return
          c.confirmResetAll()
          close()
        }}
      >
        <p className={styles.danger}>
          <WarnIcon size={16} className={styles.dangerIcon} />
          <span>
            Все вкладки вернутся к началу — <b>и «Движок» с твоими настройками тоже.</b>
          </span>
        </p>
        <label className={styles.label} htmlFor="reset-word">
          Чтобы подтвердить, впиши слово «{RESET_WORD}»
        </label>
        <input
          ref={input}
          id="reset-word"
          className={styles.input}
          value={word}
          onChange={(e) => setWord(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <p className={styles.note}>Вернуть всё можно будет кнопкой в уведомлении.</p>
        <div className={styles.buttons}>
          <button type="button" className="key" onClick={close}>
            Отмена
          </button>
          <button type="submit" className="key key--danger" disabled={!ok}>
            Сбросить всё
          </button>
        </div>
      </form>
    </Modal>
  )
}

/** Готовая игра под паролем. */
function UnlockDialog() {
  const c = useController()
  const [password, setPassword] = useState('')
  const [wrong, setWrong] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const { ref, close } = useDialog()

  return (
    <Modal title="Готовая игра под паролем" dialogRef={ref} initialFocus={input}>
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault()
          if (c.unlockFinished(password)) close()
          else {
            setWrong(true)
            input.current?.select()
          }
        }}
      >
        <label className={styles.label} htmlFor="finished-password">
          Пароль
        </label>
        <input
          ref={input}
          id="finished-password"
          className={styles.input}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={password}
          aria-invalid={wrong}
          aria-describedby={wrong ? 'finished-password-error' : undefined}
          onChange={(e) => {
            setPassword(e.target.value)
            setWrong(false)
          }}
        />
        {wrong && (
          <p id="finished-password-error" className={styles.error} role="alert">
            Пароль не подошёл. Проверь цифры и попробуй ещё раз.
          </p>
        )}
        <div className={styles.buttons}>
          <button type="button" className="key" onClick={close}>
            Отмена
          </button>
          <button type="submit" className="key key--apple" disabled={!password.trim()}>
            Открыть
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function Dialogs() {
  const dialog = useApp((s) => s.dialog)
  if (!dialog) return null
  if (dialog.kind === 'reset') return <ResetDialog key={`reset-${dialog.tab}`} tab={dialog.tab} />
  if (dialog.kind === 'unlock') return <UnlockDialog />
  return <ResetAllDialog />
}
