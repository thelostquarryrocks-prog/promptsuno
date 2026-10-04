'use client'

import { useId, useRef } from 'react'
import styles from '@/app/page.module.css'

import { BananaIcon } from './BananaIcon'
export { BananaIcon } from './BananaIcon'

export function BananaTip({ title, children, large = false }: {
  title: string
  children: React.ReactNode
  large?: boolean
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const id = useId()
  return (
    <>
      <button type="button" ref={triggerRef} className={`${styles.bananaButton} ${large ? styles.bananaLarge : ''}`}
        aria-label={`Open Monkey Method: ${title}`} aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}>
        <BananaIcon />
      </button>
      <dialog ref={dialogRef} aria-labelledby={`${id}-title`} className={styles.tipDialog}
        onClose={() => triggerRef.current?.focus()}
        onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close() }}>
        <div className={styles.tipInner}>
          <p className={styles.kicker}><BananaIcon /> Monkey Methods</p>
          <h2 id={`${id}-title`}>{title}</h2>
          <div className={styles.tipCopy}>{children}</div>
          <button type="button" autoFocus className={styles.secondaryButton} onClick={() => dialogRef.current?.close()}>Got it <span aria-hidden="true">✓</span></button>
        </div>
      </dialog>
    </>
  )
}
