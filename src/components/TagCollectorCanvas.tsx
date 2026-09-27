'use client'

import { useEffect, useRef, useState } from 'react'

const MOCK_TAGS = [
  { text: 'Cinematic score', category: 'genre', isPremium: false },
  { text: 'Synthwave', category: 'genre', isPremium: false },
  { text: 'Ambient', category: 'genre', isPremium: false },
  { text: 'Piano', category: 'instrument', isPremium: false },
  { text: '808 Drums', category: 'instrument', isPremium: true },
  { text: 'Cello', category: 'instrument', isPremium: false },
  { text: 'Melancholic', category: 'mood', isPremium: false },
  { text: 'Aggressive', category: 'mood', isPremium: false },
  { text: 'Ethereal Vocals', category: 'vocal', isPremium: true },
]

const CATEGORY_COLORS: Record<string, { fill: string, stroke: string, text: string }> = {
  genre: { fill: 'rgba(249, 115, 22, 0.15)', stroke: 'rgba(249, 115, 22, 0.5)', text: '#fdba74' }, 
  mood: { fill: 'rgba(59, 130, 246, 0.15)', stroke: 'rgba(59, 130, 246, 0.5)', text: '#93c5fd' }, 
  instrument: { fill: 'rgba(34, 197, 94, 0.15)', stroke: 'rgba(34, 197, 94, 0.5)', text: '#86efac' }, 
  vocal: { fill: 'rgba(168, 85, 247, 0.15)', stroke: 'rgba(168, 85, 247, 0.5)', text: '#d8b4fe' }, 
}

interface Node {
  id: number;
  tag: typeof MOCK_TAGS[0];
  x: number;
  y: number;
  z: number; 
  speed: number;
  alpha: number;
  width?: number;
  height?: number;
  isCaught?: boolean; 
}

interface TagCollectorProps {
  onTagsChange?: (tags: string[]) => void;
  isGenerating?: boolean; // NEW: Tells the canvas if the AI is thinking!
}

export default function TagCollectorCanvas({ onTagsChange, isGenerating }: TagCollectorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [collectedTags, setCollectedTags] = useState<string[]>([])
  const collectedTagsRef = useRef<string[]>([])
  
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [densityMultiplier, setDensityMultiplier] = useState(1)
  
  const nodesRef = useRef<Node[]>([])
  const mouseRef = useRef({ x: 0, y: 0, isDown: false })
  const orbRadiusRef = useRef(35) 

  useEffect(() => {
    collectedTagsRef.current = collectedTags;
    if (onTagsChange) {
      onTagsChange(collectedTags)
    }
  }, [collectedTags, onTagsChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
      canvas.height = 400 
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    let animationFrameId: number
    let frameCount = 0

    const spawnNode = () => {
      const availableTags = MOCK_TAGS.filter(t => 
        !collectedTagsRef.current.includes(t.text) && 
        !nodesRef.current.some(n => n.tag.text === t.text)
      )
      
      if (availableTags.length === 0) return 

      const tag = availableTags[Math.floor(Math.random() * availableTags.length)]
      nodesRef.current.push({
        id: Math.random(),
        tag,
        x: (Math.random() - 0.5) * canvas.width * 0.8 + canvas.width / 2,
        y: (Math.random() - 0.5) * canvas.height * 0.8 + canvas.height / 2,
        z: 0.1, 
        speed: 0.002 + Math.random() * 0.002, 
        alpha: 0,
        isCaught: false
      })
    }

    const draw = () => {
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      
      const targetRadius = 35 + (collectedTagsRef.current.length * 6)
      orbRadiusRef.current += (targetRadius - orbRadiusRef.current) * 0.1
      
      // NEW: Add a pulse math wave if the AI is actively generating
      const pulseOffset = isGenerating ? Math.sin(frameCount * 0.15) * 8 : 0
      const currentRadius = orbRadiusRef.current + pulseOffset

      const gradient = ctx.createRadialGradient(centerX, centerY, Math.max(1, currentRadius * 0.2), centerX, centerY, Math.max(1, currentRadius))
      gradient.addColorStop(0, isGenerating ? 'rgba(150, 100, 255, 0.9)' : 'rgba(100, 150, 255, 0.9)')
      gradient.addColorStop(0.4, isGenerating ? 'rgba(150, 100, 255, 0.4)' : 'rgba(100, 150, 255, 0.4)')
      gradient.addColorStop(1, 'rgba(100, 150, 255, 0)')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(centerX, centerY, Math.max(1, currentRadius), 0, Math.PI * 2)
      ctx.fill()

      const spawnRate = Math.max(10, Math.floor(60 / densityMultiplier))
      const maxNodes = Math.floor(15 * densityMultiplier)

      if (frameCount % spawnRate === 0 && nodesRef.current.length < maxNodes) {
        spawnNode() 
      }

      if (mouseRef.current.isDown && !isGenerating) { // Disable catching while generating
         const sortedNodes = [...nodesRef.current].filter(n => !n.isCaught).sort((a, b) => b.z - a.z);
         
         for (let i = 0; i < sortedNodes.length; i++) {
             const node = sortedNodes[i];
             if (node.width && node.height) {
                 const scaledWidth = node.width * node.z;
                 const scaledHeight = node.height * node.z;
                 const left = node.x - scaledWidth / 2;
                 const right = node.x + scaledWidth / 2;
                 const top = node.y - scaledHeight / 2;
                 const bottom = node.y + scaledHeight / 2;
                 
                 if (
                     mouseRef.current.x >= left && mouseRef.current.x <= right &&
                     mouseRef.current.y >= top && mouseRef.current.y <= bottom
                 ) {
                     if (!node.tag.isPremium) {
                         const actualNode = nodesRef.current.find(n => n.id === node.id);
                         if (actualNode) actualNode.isCaught = true;
                     } else {
                         alert(`Unlock Premium to use the ${node.tag.category} tag: ${node.tag.text}`);
                     }
                     break; 
                 }
             }
         }
         mouseRef.current.isDown = false; 
      }

      nodesRef.current.forEach((node, index) => {
        if (node.isCaught) {
          node.x += (centerX - node.x) * 0.15;
          node.y += (centerY - node.y) * 0.15;
          node.z *= 0.85; 
          
          if (Math.abs(centerX - node.x) < 5 && Math.abs(centerY - node.y) < 5) {
            setCollectedTags(prev => {
              if (prev.includes(node.tag.text)) return prev;
              return [...prev, node.tag.text];
            });
            nodesRef.current.splice(index, 1);
            return;
          }
        } else {
          node.z += (node.speed * speedMultiplier)
          
          if (node.z < 0.5) node.alpha += (0.02 * speedMultiplier)
          else if (node.z > 1.5) node.alpha -= (0.02 * speedMultiplier)

          if (node.alpha <= 0 && node.z > 1.5) {
            nodesRef.current.splice(index, 1)
            return
          }
        }

        ctx.save()
        ctx.translate(node.x, node.y)
        ctx.scale(node.z, node.z)
        ctx.globalAlpha = Math.max(0, Math.min(1, node.alpha))

        ctx.font = '12px sans-serif'
        const prefix = node.tag.isPremium ? '🔒 ' : ''
        const displayText = `${prefix}${node.tag.text}`
        const textWidth = ctx.measureText(displayText).width
        const pillWidth = textWidth + 20 
        const pillHeight = 24 
        
        node.width = pillWidth;
        node.height = pillHeight;

        const colors = CATEGORY_COLORS[node.tag.category] || CATEGORY_COLORS.genre;
        
        ctx.fillStyle = node.tag.isPremium ? 'rgba(30, 30, 30, 0.8)' : colors.fill
        ctx.strokeStyle = node.tag.isPremium ? 'rgba(80, 80, 80, 0.8)' : colors.stroke
        ctx.lineWidth = 1.5 
        
        ctx.beginPath()
        ctx.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, 12)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = node.tag.isPremium ? '#666666' : colors.text
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(displayText, 0, 0)
        
        ctx.restore()
      })

      frameCount++
      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [speedMultiplier, densityMultiplier, isGenerating]) // ADDED isGenerating to dependencies

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        isDown: true
      };
    }
  }

  return (
    <div className="w-full flex flex-col items-center space-y-4">
      <div className="relative w-full rounded-xl overflow-hidden border border-gray-800 shadow-2xl bg-black">
        <canvas 
          ref={canvasRef} 
          className="w-full cursor-crosshair touch-none"
          onPointerDown={handlePointerDown}
        />
      </div>

      <div className="w-full flex flex-col sm:flex-row gap-4 items-center justify-between px-2">
        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-semibold text-gray-400">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Mood</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Genre</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Instrument</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Vocal</span>
        </div>

        <div className="flex gap-4 w-full sm:w-auto">
          <div className="flex flex-col flex-1 sm:w-24">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Speed</label>
            <input 
              type="range" min="0.2" max="3" step="0.1" 
              value={speedMultiplier} 
              onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
          <div className="flex flex-col flex-1 sm:w-24">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Density</label>
            <input 
              type="range" min="0.5" max="2.5" step="0.1" 
              value={densityMultiplier} 
              onChange={(e) => setDensityMultiplier(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="w-full min-h-[60px] p-3 rounded-md border border-gray-700 bg-[#1a1a1a] flex flex-wrap gap-2 relative">
        {collectedTags.length === 0 ? (
          <span className="text-sm text-gray-500 my-auto italic">Tap floating nodes to catch them...</span>
        ) : (
          <>
            {collectedTags.map((tag, i) => {
              const tagData = MOCK_TAGS.find(t => t.text === tag)
              const colors = tagData ? CATEGORY_COLORS[tagData.category] : CATEGORY_COLORS.genre

              return (
                <span 
                  key={i} 
                  style={{ backgroundColor: colors.fill, borderColor: colors.stroke, color: colors.text }}
                  className="px-3 py-1 text-sm rounded-full border flex items-center gap-2 shadow-sm"
                >
                  {tag}
                  <button 
                    onClick={() => setCollectedTags(prev => prev.filter(t => t !== tag))}
                    style={{ color: colors.stroke }}
                    className="hover:text-white transition-colors text-lg leading-none mb-[2px]"
                  >
                    &times;
                  </button>
                </span>
              )
            })}
            
            {/* NEW: Clear All Button */}
            <button 
              onClick={() => setCollectedTags([])}
              className="ml-auto mt-auto mb-auto text-xs text-gray-400 hover:text-white underline decoration-gray-600 underline-offset-2 transition-colors"
            >
              Clear All
            </button>
          </>
        )}
      </div>
    </div>
  )
}