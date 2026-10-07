'use client'

import { useMemo } from 'react'
import type { SelectedNode } from '../lib/compiler-contract'
import { findCatalogMentions, type MentionIndex } from '../lib/catalog-mentions'

export default function MentionSuggestions({ text, index, selectedNodes, onAdd, disabled = false }: {
  text: string
  index: MentionIndex
  selectedNodes: SelectedNode[]
  onAdd: (node: SelectedNode) => void
  disabled?: boolean
}) {
  const mentions = useMemo(() => findCatalogMentions(text, index), [text, index])
  const selected = new Set(selectedNodes.map(node => node.node_id))
  const open = mentions.filter(node => !selected.has(node.node_id))
  if (open.length === 0) return null
  return <div className="mention-suggestions" role="group" aria-labelledby="mention-heading">
    <p id="mention-heading">Found in your description <span>Tap to add to your sound</span></p>
    <div className="mention-chips">
      {open.map(node => <button key={node.node_id} type="button" data-category={node.category} disabled={disabled}
        aria-label={`Add ${node.label} from your description`} onClick={() => onAdd(node)}>
        <span aria-hidden="true">+</span>{node.label}<small>{node.category}</small>
      </button>)}
      {open.length > 1 && <button type="button" className="mention-all" disabled={disabled} onClick={() => open.forEach(onAdd)}>Add all {open.length}</button>}
    </div>
  </div>
}
