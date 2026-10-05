'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import type { DiscoveryAffinities, SelectedNode } from '../lib/compiler-contract'
import './sound-brain.css'

export type SoundBrainCanvasProps = {
  discoveryNodes: SelectedNode[]
  affinities: DiscoveryAffinities
  selectedNodes: SelectedNode[]
  onCollect: (node: SelectedNode) => void
  onRemove: (nodeId: string) => void
  disabled?: boolean
}

const categoryOrder = ['Genre', 'Mood', 'Instrument', 'Vocal', 'Rhythm', 'Texture', 'Production', 'Structure', 'Energy', 'Era']
const symbols: Record<string, string> = { Genre: '♫', Mood: '◒', Instrument: '♬', Vocal: '◉', Rhythm: '≋', Texture: '✧', Production: '⌘', Structure: '▤', Energy: 'ϟ', Era: '◷' }
type Drag = { pointer: number; node: SelectedNode; target: HTMLButtonElement; startX: number; startY: number; x: number; y: number; moved: boolean }

export default function SoundBrainCanvas({ discoveryNodes, affinities, selectedNodes, onCollect, onRemove, disabled = false }: SoundBrainCanvasProps) {
  const [category, setCategory] = useState('All')
  const [pending, setPending] = useState<string | null>(null)
  const pendingRef = useRef<string | null>(null)
  const [offset, setOffset] = useState(0)
  const [browseCount, setBrowseCount] = useState(24)
  const [speed, setSpeed] = useState(1)
  const [density, setDensity] = useState(1)
  const [connection, setConnection] = useState(1)
  const [active, setActive] = useState<Drag | null>(null)
  const drag = useRef<Drag | null>(null)
  const orb = useRef<HTMLDivElement>(null)
  const categoryRow = useRef<HTMLDivElement>(null)
  const [catchCount, setCatchCount] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [compact, setCompact] = useState(false)
  const [paused, setPaused] = useState(false)
  const suppressClick = useRef(false)
  const categories = useMemo(() => ['All', ...Array.from(new Set(discoveryNodes.map(node => node.category))).sort((a, b) => {
    const ai = categoryOrder.indexOf(a), bi = categoryOrder.indexOf(b)
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.localeCompare(b)
  })], [discoveryNodes])
  const pool = useMemo(() => discoveryNodes.filter(node => category === 'All' || node.category === category), [discoveryNodes, category])
  const count = Math.min(pool.length, compact ? 8 : 12, Math.round(6 * density))
  const visible = Array.from({ length: count }, (_, i) => pool[(offset + i) % pool.length])
  const selected = new Set(selectedNodes.map(node => node.node_id))

  useEffect(() => {
    const revealCategory = () => {
      const row = categoryRow.current
      const button = row?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
      if (!row || !button) return
      const left = button.offsetLeft - row.offsetLeft
      if (left < row.scrollLeft) row.scrollLeft = left
      else if (left + button.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollLeft = left + button.offsetWidth - row.clientWidth
    }
    revealCategory()
    window.addEventListener('resize', revealCategory)
    return () => window.removeEventListener('resize', revealCategory)
  }, [category])

  useEffect(() => {
    if (!window.matchMedia) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const narrow = window.matchMedia('(max-width: 700px)')
    const update = () => { setReducedMotion(media.matches); setCompact(narrow.matches) }
    update()
    media.addEventListener('change', update)
    narrow.addEventListener('change', update)
    return () => { media.removeEventListener('change', update); narrow.removeEventListener('change', update) }
  }, [])

  useEffect(() => {
    if (reducedMotion || paused || disabled) return
    const timer = window.setInterval(() => {
      if (!drag.current && !document.hidden) setOffset(value => (value + Math.max(1, count)) % Math.max(1, pool.length))
    }, 12000 / speed)
    return () => window.clearInterval(timer)
  }, [count, pool.length, speed, reducedMotion, paused, disabled])

  useEffect(() => () => {
    const current = drag.current
    drag.current = null
    if (current?.target.hasPointerCapture?.(current.pointer)) current.target.releasePointerCapture(current.pointer)
  }, [])

  function collect(node: SelectedNode) {
    if (disabled || selected.has(node.node_id)) return
    onCollect(node)
    setCatchCount(value => value + 1)
  }

  function switchCategory(next: string) {
    if (drag.current) {
      pendingRef.current = next
      setPending(next)
      return
    }
    setCategory(next)
    setOffset(0)
    setBrowseCount(24)
  }

  function finish(event: PointerEvent<HTMLButtonElement>, cancelled = false) {
    const current = drag.current
    if (!current || event.pointerId !== current.pointer) return
    drag.current = null
    setActive(null)
    suppressClick.current = current.moved || cancelled
    if (current.target.hasPointerCapture?.(current.pointer)) current.target.releasePointerCapture(current.pointer)
    const rect = orb.current?.getBoundingClientRect()
    if (!cancelled && current.moved && rect && Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2)) < rect.width / 2 + 12) collect(current.node)
    if (pendingRef.current !== null) {
      setCategory(pendingRef.current)
      setOffset(0)
      setBrowseCount(24)
      pendingRef.current = null
      setPending(null)
    }
  }

  return <div className="sound-brain">
    <div ref={categoryRow} className="brain-categories" role="group" aria-label="Style categories">
      {categories.map(item => <button key={item} type="button" aria-pressed={category === item} onClick={() => switchCategory(item)}>
        <span aria-hidden="true">{symbols[item] ?? '✦'}</span> {item}
      </button>)}
    </div>
    <p className="brain-direction" role="status">{pending ? `Finish your drag to explore ${pending}.` : `${category === 'All' ? 'All styles' : category} · ${pool.length} to explore`}<span>Drag into the orb, or tap a style.</span></p>
    <div className={`brain-scene ${active ? 'is-dragging' : ''}`} data-testid="sound-brain-scene" aria-label="Drag musical nodes to the central Sound Brain"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }}>
      <div className="brain-orbits" aria-hidden="true" />
      <div ref={orb} className="brain-orb" data-testid="brain-orb">
        <div key={catchCount} className={catchCount ? 'brain-aura absorbed' : 'brain-aura'} aria-hidden="true" />
        <div className="brain-mascot"><Image src="/images/design/hero-monkey.webp" alt="" fill sizes="240px" draggable={false} /></div>
        <span className="brain-orb-label">DROP STYLES HERE</span>
      </div>
      <div className="brain-stream" key={category}>
        {visible.map((node, index) => {
          const moving = active?.node.node_id === node.node_id
          const weight = active ? affinities[node.node_id]?.[active.node.node_id] ?? 0.2 : 0
          return <button type="button" key={`${index}-${node.node_id}`} className={`brain-node slot-${index} ${moving ? 'is-active' : ''} ${active && weight >= 0.7 && connection > 0 ? 'is-related' : ''}`}
            data-stream-node={node.node_id} data-category={node.category} aria-label={`Add ${node.label}`} disabled={disabled || selected.has(node.node_id)}
            style={{ '--drift-time': `${9 / speed}s`, '--connection': connection, ...(moving ? { transform: `translate(${active.x - active.startX}px, ${active.y - active.startY}px)` } : {}) } as CSSProperties}
            onPointerDown={event => {
              if (disabled || drag.current || event.button !== 0) return
              suppressClick.current = false
              event.currentTarget.setPointerCapture(event.pointerId)
              const current = { pointer: event.pointerId, node, target: event.currentTarget, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, moved: false }
              drag.current = current
              setActive(current)
            }}
            onPointerMove={event => {
              const current = drag.current
              if (!current || current.pointer !== event.pointerId) return
              const next = { ...current, x: event.clientX, y: event.clientY, moved: current.moved || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) > 8 }
              drag.current = next
              setActive(next)
            }}
            onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)} onLostPointerCapture={event => finish(event, true)}
            onClick={event => { if (event.detail === 0 || !suppressClick.current) collect(node); suppressClick.current = false }}>
            <span aria-hidden="true">{symbols[node.category] ?? '✦'}</span><span>{node.label}</span>
          </button>
        })}
      </div>
      <span className="brain-scene-caption">YOUR SOUND, TAKING SHAPE</span>
      <button type="button" className="brain-next" disabled={!!active || disabled || pool.length <= count} onClick={() => setOffset(value => (value + count) % pool.length)}>More styles <span aria-hidden="true">↗</span></button>
    </div>
    <div className="brain-tray" aria-label="Collected nodes">
      <div className="brain-tray-heading">SELECTED STYLES <span>({selectedNodes.length})</span></div>
      <div className="brain-selections">{selectedNodes.length === 0 ? <p>Your mix starts here. Add a style above.</p> : selectedNodes.map(node => <span key={node.node_id} data-node-id={node.node_id} className="brain-selection">
        <span aria-hidden="true">{symbols[node.category] ?? '✦'}</span>{node.label}<button type="button" aria-label={`Remove ${node.label}`} disabled={disabled} onClick={() => onRemove(node.node_id)}>×</button>
      </span>)}</div>
    </div>
    <div className="brain-controls">{[
      { name: 'Speed', value: speed, set: setSpeed, min: 0.2, max: 3 },
      { name: 'Density', value: density, set: setDensity, min: 0.5, max: 2 },
      { name: 'Connection', value: connection, set: setConnection, min: 0, max: 1.5 },
    ].map(control => <label key={control.name}>{control.name}<input aria-label={control.name} type="range" min={control.min} max={control.max} step="0.1" value={control.value} disabled={!!active} onChange={event => control.set(Number(event.target.value))} /></label>)}</div>
    <details className="brain-accessible"><summary>Choose nodes without dragging</summary><div className="brain-catalog">
      {pool.slice(0, browseCount).map(node => <button key={node.node_id} type="button" disabled={disabled || selected.has(node.node_id)} onClick={() => collect(node)}>Collect {node.label}</button>)}
    </div>{browseCount < pool.length && <button type="button" className="brain-more" onClick={() => setBrowseCount(value => value + 24)}>Show more {category === 'All' ? '' : category.toLowerCase() + ' '}styles ({Math.min(browseCount, pool.length)} of {pool.length})</button>}</details>
  </div>
}
