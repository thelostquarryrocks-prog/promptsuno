'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial, Text } from '@react-three/drei'
import { useRef, useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'

// 1. The Relationship Matrix
const MATRIX: Record<string, Record<string, number>> = {
  "Cinematic": { "Cello": 0.92, "Dark": 0.88, "Piano": 0.85, "Ethereal Vocals": 0.75, "Sparse Arrangement": 0.45, "Aggressive": 0.35, "808 Drums": 0.10 },
  "Aggressive": { "Driving Rhythm": 0.95, "808 Drums": 0.90, "Dark": 0.85, "Staccato": 0.75, "Synthwave": 0.60, "Piano": 0.40, "Dreamy Ambient": 0.05, "Ethereal Vocals": 0.08 },
  "Synthwave": { "808 Drums": 0.95, "Driving Rhythm": 0.88, "Dark": 0.65, "Ethereal Vocals": 0.50, "Staccato": 0.45, "Piano": 0.25, "Cello": 0.10, "Sparse Arrangement": 0.15 },
  "Dreamy Ambient": { "Ethereal Vocals": 0.95, "Sparse Arrangement": 0.85, "Piano": 0.80, "Cinematic": 0.70, "Cello": 0.65, "Driving Rhythm": 0.15, "Aggressive": 0.02, "808 Drums": 0.05 },
  "Piano": { "Cinematic": 0.85, "Dreamy Ambient": 0.80, "Sparse Arrangement": 0.75, "Cello": 0.70, "Ethereal Vocals": 0.65, "Staccato": 0.60, "Dark": 0.55, "Aggressive": 0.40 },
  "808 Drums": { "Synthwave": 0.95, "Aggressive": 0.90, "Driving Rhythm": 0.85, "Dark": 0.70, "Staccato": 0.50, "Sparse Arrangement": 0.20, "Cinematic": 0.10, "Dreamy Ambient": 0.05 },
  "Sparse Arrangement": { "Dreamy Ambient": 0.85, "Ethereal Vocals": 0.80, "Piano": 0.75, "Cello": 0.70, "Cinematic": 0.45, "Staccato": 0.40, "Driving Rhythm": 0.15, "808 Drums": 0.20 }
}

const MATRIX_TAGS = ['Cinematic', 'Aggressive', 'Synthwave', 'Dreamy Ambient', 'Piano', '808 Drums', 'Sparse Arrangement', 'Cello', 'Dark', 'Ethereal Vocals', 'Driving Rhythm', 'Staccato']

const TAG_CATEGORIES: Record<string, string> = {
  'Cinematic': 'genre', 'Synthwave': 'genre', 'Dreamy Ambient': 'genre', 
  'Dark': 'mood', 'Aggressive': 'mood', 
  'Piano': 'instrument', '808 Drums': 'instrument', 'Cello': 'instrument', 
  'Ethereal Vocals': 'vocal', 
  'Driving Rhythm': 'rhythm', 'Staccato': 'rhythm', 
  'Sparse Arrangement': 'production'
}

const BASE_COLOR = new THREE.Color("#ffffff")
const DIM_COLOR = new THREE.Color("#444444")
const COLORS: Record<string, THREE.Color> = {
  genre: new THREE.Color('#fdba74'),
  mood: new THREE.Color('#93c5fd'),
  instrument: new THREE.Color('#86efac'),
  vocal: new THREE.Color('#d8b4fe'),
  rhythm: new THREE.Color('#fde047'),
  production: new THREE.Color('#fca5a5')
}

function getWeight(tagA: string, tagB: string): number {
  if (MATRIX[tagA]?.[tagB]) return MATRIX[tagA][tagB]
  if (MATRIX[tagB]?.[tagA]) return MATRIX[tagB][tagA]
  return 0.20 
}

type GlobalState = { 
  activeId: number | null, 
  activeTag: string | null, 
  activeX: number, 
  activeY: number,
  dragStartX: number,
  dragStartY: number,
  justClicked: boolean,
  dragIntensity: number, 
  isDragging: boolean,
  speedMult: number,
  gravityMult: number 
}

function FloatingNode({ id, tag, startZ, globalState, onCatch }: { id: number, tag: string, startZ: number, globalState: React.MutableRefObject<GlobalState>, onCatch: (tag: string) => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const textRef = useRef<any>(null)
  const dotMaterialRef = useRef<THREE.MeshStandardMaterial>(null)
  
  const baseSpeed = useMemo(() => 1.5 + Math.random() * 1.5, []) 
  const startX = useMemo(() => (Math.random() - 0.5) * 15, [])
  const startY = useMemo(() => (Math.random() - 0.5) * 15, [])

  const category = TAG_CATEGORIES[tag] || 'genre'
  const targetColor = COLORS[category]

  const vec = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    if (!groupRef.current || !textRef.current || !dotMaterialRef.current) return

    const gs = globalState.current
    const isDraggingMe = gs.activeId === id

    vec.set(state.pointer.x, state.pointer.y, 0.5)
    vec.unproject(state.camera)
    dir.copy(vec).sub(state.camera.position).normalize()
    const distToZ0 = (0 - state.camera.position.z) / dir.z
    const mouseWorldPos = state.camera.position.clone().add(dir.multiplyScalar(distToZ0))

    if (isDraggingMe) {
      if (gs.justClicked) {
        gs.dragStartX = mouseWorldPos.x
        gs.dragStartY = mouseWorldPos.y
        gs.justClicked = false
      }
      
      if (!gs.isDragging) {
        const dist = Math.sqrt(Math.pow(mouseWorldPos.x - gs.dragStartX, 2) + Math.pow(mouseWorldPos.y - gs.dragStartY, 2))
        if (dist > 0.5) gs.isDragging = true
      }
    }

    if (id === 0) { 
      const targetIntensity = gs.isDragging ? 1 : 0
      gs.dragIntensity = THREE.MathUtils.lerp(gs.dragIntensity, targetIntensity, delta * 5)
      if (gs.dragIntensity < 0.05 && !gs.isDragging) gs.activeTag = null
    }

    const intensity = gs.dragIntensity
    const hasActiveNetwork = gs.activeTag !== null
    const weight = hasActiveNetwork ? getWeight(tag, gs.activeTag!) : 0
    const isRelated = weight >= 0.70

    if (isDraggingMe) {
      if (gs.isDragging) {
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, mouseWorldPos.x, 0.3)
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, mouseWorldPos.y, 0.3)
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, 0.2) 
        
        gs.activeX = groupRef.current.position.x
        gs.activeY = groupRef.current.position.y
      }
    } else {
      const currentSpeed = baseSpeed * gs.speedMult * (1 - intensity)
      groupRef.current.position.z += currentSpeed * delta

      if (hasActiveNetwork && !isDraggingMe && isRelated) {
        const pull = weight * delta * 0.5 * gs.gravityMult * intensity
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, gs.activeX, pull)
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, gs.activeY, pull)
      }
    }

    const z = groupRef.current.position.z
    let baseOpacity = 1
    if (z < -15) baseOpacity = (z + 20) / 5
    else if (z > 5) baseOpacity = 1 - ((z - 5) / 5)
    baseOpacity = Math.max(0, Math.min(1, baseOpacity))

    if (hasActiveNetwork) {
      if (isDraggingMe || isRelated) {
        textRef.current.fillOpacity = THREE.MathUtils.lerp(textRef.current.fillOpacity, baseOpacity, delta * 5)
        textRef.current.color = new THREE.Color(textRef.current.color).lerp(targetColor, delta * 5)
        dotMaterialRef.current.color.lerp(targetColor, delta * 5)
        dotMaterialRef.current.emissive.lerp(targetColor, delta * 5)
        dotMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(dotMaterialRef.current.emissiveIntensity, 2, delta * 5)
      } else {
        const dimOpacity = baseOpacity * 0.15
        textRef.current.fillOpacity = THREE.MathUtils.lerp(textRef.current.fillOpacity, dimOpacity, delta * 5)
        textRef.current.color = new THREE.Color(textRef.current.color).lerp(DIM_COLOR, delta * 5)
        dotMaterialRef.current.color.lerp(BASE_COLOR, delta * 5)
        dotMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(dotMaterialRef.current.emissiveIntensity, 0, delta * 5)
      }
    } else {
      textRef.current.fillOpacity = THREE.MathUtils.lerp(textRef.current.fillOpacity, baseOpacity, delta * 5)
      textRef.current.color = new THREE.Color(textRef.current.color).lerp(BASE_COLOR, delta * 5)
      dotMaterialRef.current.color.lerp(BASE_COLOR, delta * 5)
      dotMaterialRef.current.emissive.lerp(BASE_COLOR, delta * 5)
      dotMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(dotMaterialRef.current.emissiveIntensity, baseOpacity * 0.5, delta * 5)
    }

    if (z > 10 && !isDraggingMe) {
      groupRef.current.position.z = -20
      groupRef.current.position.x = (Math.random() - 0.5) * 15
      groupRef.current.position.y = (Math.random() - 0.5) * 15
    }
  })

  return (
    <group 
      ref={groupRef} 
      position={[startX, startY, startZ]}
      onPointerDown={(e) => {
        e.stopPropagation();
        // @ts-ignore
        e.target.setPointerCapture(e.pointerId);
        globalState.current.activeId = id;
        globalState.current.activeTag = tag;
        globalState.current.justClicked = true;
        globalState.current.isDragging = false;
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        // @ts-ignore
        e.target.releasePointerCapture(e.pointerId);
        
        if (groupRef.current && globalState.current.isDragging) {
          const x = groupRef.current.position.x;
          const y = groupRef.current.position.y;
          const distanceToCenter = Math.sqrt(x * x + y * y);
          
          if (distanceToCenter < 2.5) {
            onCatch(tag);
            groupRef.current.position.z = -20;
            groupRef.current.position.x = (Math.random() - 0.5) * 15;
            groupRef.current.position.y = (Math.random() - 0.5) * 15;
          }
        }

        globalState.current.activeId = null;
        globalState.current.isDragging = false;
        document.body.style.cursor = 'auto';
      }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'grab' }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}
    >
      <Sphere args={[0.15, 16, 16]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          ref={dotMaterialRef}
          color={BASE_COLOR} 
          emissive={BASE_COLOR}
          transparent
          depthWrite={false}
          toneMapped={false} 
        />
      </Sphere>
      
      <Text ref={textRef} position={[0.3, 0, 0]} fontSize={0.5} color="#ffffff" anchorX="left" anchorY="middle">
        {tag}
      </Text>
    </group>
  )
}

function NodeSwarm({ onCatch, globalState, density }: { onCatch: (tag: string) => void, globalState: React.MutableRefObject<GlobalState>, density: number }) {
  const initialNodes = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      tag: MATRIX_TAGS[Math.floor(Math.random() * MATRIX_TAGS.length)],
      startZ: -20 + (Math.random() * 30)
    }))
  }, [])

  const activeCount = Math.floor(30 * density);

  return (
    <>
      {initialNodes.slice(0, activeCount).map((node) => (
        <FloatingNode key={node.id} id={node.id} tag={node.tag} startZ={node.startZ} globalState={globalState} onCatch={onCatch} />
      ))}
    </>
  )
}

function BrainOrb({ collectedTags, gulpTrigger }: { collectedTags: string[], gulpTrigger: { tag: string, ts: number } | null }) {
  const materialRef = useRef<any>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  
  // 1. Calculate blended color based on all active tags
  const targetBaseColor = useMemo(() => {
    // FIX: Default back to the original deep indigo instead of pitch black
    if (collectedTags.length === 0) return new THREE.Color("#4a00e0") 
    
    const blended = new THREE.Color(0, 0, 0)
    collectedTags.forEach(tag => {
      const cat = TAG_CATEGORIES[tag] || 'genre'
      blended.add(COLORS[cat])
    })
    blended.multiplyScalar(1 / collectedTags.length)
    return blended
  }, [collectedTags])

  // 2. Cap size growth at 10 nodes (Base scale 1.5 -> Max 3.0)
  const targetScale = useMemo(() => {
    return Math.min(1.5 + (collectedTags.length * 0.15), 3.0)
  }, [collectedTags.length])

  // 3. Animation state machine ref (bypasses React state for 60fps)
  const animState = useRef({
    phase: 'idle', // 'idle', 'shrinking', 'plumping', 'settling'
    timer: 0,
    flashColor: new THREE.Color()
  })

  // 4. Listen for new catches to trigger the "Gulp"
  useEffect(() => {
    if (gulpTrigger) {
      animState.current.phase = 'shrinking'
      animState.current.timer = 0
      const cat = TAG_CATEGORIES[gulpTrigger.tag] || 'genre'
      animState.current.flashColor.copy(COLORS[cat])
    }
  }, [gulpTrigger])

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return
    const mesh = meshRef.current
    const mat = materialRef.current

    if (animState.current.phase !== 'idle') {
      animState.current.timer += delta
      const t = animState.current.timer

      if (animState.current.phase === 'shrinking') {
        // Phase 1: Rapid suck inward
        mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, targetScale * 0.6, delta * 20))
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.1, delta * 15)
        mat.distort = THREE.MathUtils.lerp(mat.distort, 0.1, delta * 15)
        
        if (t > 0.08) {
          animState.current.phase = 'plumping'
          animState.current.timer = 0
        }
      } else if (animState.current.phase === 'plumping') {
        // Phase 2: Explosive rebound with neon flash of the exact node color
        mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, targetScale * 1.2, delta * 15))
        mat.color.lerp(animState.current.flashColor, delta * 20)
        mat.emissive.lerp(animState.current.flashColor, delta * 20)
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 4.0, delta * 20)
        mat.distort = THREE.MathUtils.lerp(mat.distort, 0.9, delta * 10) 
        
        if (t > 0.2) {
          animState.current.phase = 'settling'
          animState.current.timer = 0
        }
      } else if (animState.current.phase === 'settling') {
        // Phase 3: Settle into new blended color and size
        mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, targetScale, delta * 8))
        mat.color.lerp(targetBaseColor, delta * 8)
        mat.emissive.lerp(targetBaseColor, delta * 8)
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.5 + (collectedTags.length * 0.1), delta * 5)
        mat.distort = THREE.MathUtils.lerp(mat.distort, 0.4, delta * 5)

        if (t > 0.6 && Math.abs(mesh.scale.x - targetScale) < 0.01) {
          animState.current.phase = 'idle'
        }
      }
    } else {
      // Idle: Smoothly handle deflations (tag removals) and maintain blended pulse
      mesh.scale.setScalar(THREE.MathUtils.lerp(mesh.scale.x, targetScale, delta * 4))
      mat.color.lerp(targetBaseColor, delta * 4)
      mat.emissive.lerp(targetBaseColor, delta * 4)
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, 0.5 + (collectedTags.length * 0.1), delta * 4)
      mat.distort = THREE.MathUtils.lerp(mat.distort, 0.4, delta * 4)
    }
  })

  // Note: Base size is 1 to allow clean scaling math.
  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} position={[0, 0, 0]}>
      <MeshDistortMaterial 
        ref={materialRef}
        roughness={0.2} metalness={0.8} speed={2}       
      />
    </Sphere>
  )
}

export default function SoundBrainCanvas() {
  const [collectedTags, setCollectedTags] = useState<string[]>([])
  const [gulpTrigger, setGulpTrigger] = useState<{tag: string, ts: number} | null>(null)
  
  const [speed, setSpeed] = useState(1)
  const [density, setDensity] = useState(1)
  const [gravity, setGravity] = useState(1)

  const globalState = useRef<GlobalState>({ 
    activeId: null, activeTag: null, activeX: 0, activeY: 0,
    dragStartX: 0, dragStartY: 0, justClicked: false,
    dragIntensity: 0, isDragging: false, speedMult: 1, gravityMult: 1 
  })

  useEffect(() => {
    globalState.current.speedMult = speed;
    globalState.current.gravityMult = gravity;
  }, [speed, gravity])

  const handleCatch = (tag: string) => {
    setCollectedTags((prev) => prev.includes(tag) ? prev : [...prev, tag])
    setGulpTrigger({ tag, ts: Date.now() })
  }

  const removeTag = (tagToRemove: string) => {
    setCollectedTags((prev) => prev.filter(t => t !== tagToRemove))
  }

  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="w-full h-[500px] rounded-xl overflow-hidden bg-black border border-gray-800 shadow-2xl relative">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 0, 0]} intensity={2} color="#8a2be2" />
          <pointLight position={[5, 5, 5]} intensity={0.5} color="#4b0082" />

          <NodeSwarm onCatch={handleCatch} globalState={globalState} density={density} />

          <BrainOrb collectedTags={collectedTags} gulpTrigger={gulpTrigger} />
        </Canvas>
        <div className="absolute top-4 left-4 text-[10px] font-mono text-gray-500 pointer-events-none tracking-widest bg-black/50 px-2 py-1 rounded">
          DRAG TO CENTER ORB
        </div>
      </div>

      <div className="w-full flex justify-between gap-4 px-2">
        <div className="flex flex-col items-center w-1/3">
          <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-semibold px-2 py-0.5">Speed</label>
          <input type="range" min="0.2" max="3" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
        </div>
        <div className="flex flex-col items-center w-1/3">
          <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-semibold px-2 py-0.5">Density</label>
          <input type="range" min="0.5" max="2" step="0.1" value={density} onChange={(e) => setDensity(parseFloat(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
        </div>
        <div className="flex flex-col items-center w-1/3">
          <label className="text-[10px] uppercase tracking-widest text-gray-400 mb-1 font-semibold px-2 py-0.5">Connection</label>
          <input type="range" min="0" max="1.5" step="0.1" value={gravity} onChange={(e) => setGravity(parseFloat(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
        </div>
      </div>

      <div className="w-full min-h-[60px] p-3 rounded-md border border-gray-700 bg-[#1a1a1a] flex flex-wrap gap-2">
        {collectedTags.length === 0 ? (
          <span className="text-sm text-gray-500 my-auto italic">Caught nodes will appear here...</span>
        ) : (
          collectedTags.map((tag, i) => {
            const category = TAG_CATEGORIES[tag] || 'genre'
            const dotColor = COLORS[category].getHexString()
            return (
              <span key={i} className="px-3 py-1 bg-black/40 text-sm rounded-full border border-gray-700 flex items-center gap-2 shadow-sm text-white">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${dotColor}`, boxShadow: `0 0 5px #${dotColor}` }}></div>
                {tag}
                <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-white transition-colors text-lg leading-none mb-[2px]">×</button>
              </span>
            )
          })
        )}
      </div>
    </div>
  )
}