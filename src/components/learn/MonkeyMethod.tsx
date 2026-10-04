"use client"

import { useEffect, useId, useRef, useState } from "react"
import type { MonkeyMethod as MonkeyMethodData } from "@/content/learn/types"
import { BananaIcon } from "@/components/home/BananaIcon"
import styles from "./learn.module.css"

type MonkeyMethodProps = {
  method: MonkeyMethodData
}

type RotationState = {
  seen: number[]
  current: number
}

const storagePrefix = "promptsuno:monkey-method:v1:"

function readRotationState(method: MonkeyMethodData): RotationState {
  if (typeof window === "undefined" || method.kind !== "rotating") {
    return { seen: [], current: 0 }
  }

  try {
    const raw = window.localStorage.getItem(`${storagePrefix}${method.id}`)
    if (!raw) return { seen: [], current: 0 }
    const parsed = JSON.parse(raw) as Partial<RotationState>
    const validSeen = Array.isArray(parsed.seen)
      ? parsed.seen.filter((value) => Number.isInteger(value) && value >= 0 && value < method.tips.length)
      : []
    const current = Number.isInteger(parsed.current) && parsed.current! >= 0 && parsed.current! < method.tips.length
      ? parsed.current!
      : 0
    return { seen: [...new Set(validSeen)], current }
  } catch {
    return { seen: [], current: 0 }
  }
}

function nextUnseenIndex(state: RotationState, tipCount: number) {
  const seen = state.seen.includes(state.current) ? state.seen : [...state.seen, state.current]
  const unseen = Array.from({ length: tipCount }, (_, index) => index).filter((index) => !seen.includes(index))

  if (unseen.length > 0) {
    return { seen, current: unseen[0] }
  }

  return { seen: [], current: state.current === tipCount - 1 ? 0 : state.current + 1 }
}

function markCurrentSeen(state: RotationState): RotationState {
  return state.seen.includes(state.current)
    ? state
    : { ...state, seen: [...state.seen, state.current] }
}

function rotationForOpen(method: MonkeyMethodData) {
  const stored = readRotationState(method)
  const display = stored.seen.includes(stored.current)
    ? nextUnseenIndex(stored, method.tips.length)
    : stored
  return markCurrentSeen(display)
}

export function MonkeyMethod({ method }: MonkeyMethodProps) {
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [rotation, setRotation] = useState<RotationState>({ seen: [], current: 0 })

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const openMethod = () => {
    if (!isOpen && method.kind === "rotating") {
      const next = rotationForOpen(method)
      setRotation(next)
      try {
        window.localStorage.setItem(`${storagePrefix}${method.id}`, JSON.stringify(next))
      } catch {
        // Rotation still works for the current visit when storage is blocked.
      }
    }
    setIsOpen((current) => !current)
    setHasOpened(true)

    try {
      if (method.kind === "static") {
        window.localStorage.setItem(`${storagePrefix}${method.id}`, "opened")
      }
    } catch {
      // Coaching remains available when browser storage is blocked.
    }
  }

  const showNext = () => {
    const next = markCurrentSeen(nextUnseenIndex(rotation, method.tips.length))
    setRotation(next)
    try {
      window.localStorage.setItem(`${storagePrefix}${method.id}`, JSON.stringify(next))
    } catch {
      // Rotation still works for the current visit when storage is blocked.
    }
  }

  return (
    <aside className={styles.monkeyMethod} aria-labelledby={`${panelId}-title`}>
      <div className={styles.monkeyTopline}>
        <div className={styles.monkeyHeading}>
          <span className={styles.monkeyLabel}>Monkey Method</span>
          <h2 id={`${panelId}-title`}>{method.title}</h2>
          <p>{method.summary}</p>
        </div>
        <button
          ref={triggerRef}
          type="button"
          className={styles.monkeyTrigger}
          aria-expanded={isOpen}
          aria-controls={panelId}
          aria-label={`${isOpen ? "Close" : "Open"} Monkey Method: ${method.title}`}
          onClick={openMethod}
        >
          <BananaIcon className={styles.monkeyMark} />
          <span className={styles.srOnly}>{isOpen ? "Close" : hasOpened ? "Open again" : "Show method"}</span>
        </button>
      </div>
      <div id={panelId} hidden={!isOpen} className={styles.monkeyPanel}>
        <p aria-live={method.kind === "rotating" ? "polite" : undefined}>
          {method.tips[method.kind === "rotating" ? rotation.current : 0]}
        </p>
        {method.kind === "rotating" ? (
          <button type="button" className={styles.textButton} onClick={showNext}>
            Another idea
          </button>
        ) : null}
      </div>
    </aside>
  )
}
