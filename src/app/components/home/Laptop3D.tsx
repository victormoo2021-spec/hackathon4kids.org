'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import { Color, MathUtils, Vector3, type Group, type PointLight } from 'three'
import { fx } from '../fx/store'

const D2R = Math.PI / 180
const SCREEN_W = 2.8
const SCREEN_H = 1.82
const LID_Z = 1.06 // lid centre, measured from the hinge along the lid
// Layout size of the screen DOM. It is projected with a CSS matrix3d (below) and Chrome rasterises it at the
// final scale, so text stays crisp as long as this is >= the projected size (~500px at 1440 wide).
const PX_W = 1000
const PX_H = Math.round((PX_W * SCREEN_H) / SCREEN_W)
const GLOW = { purple: '#6d5cff', violet: '#a78bff', gold: '#ffaa05' } as const

type Props = { progress: number; host: HTMLElement; onReady: () => void; onFail: () => void }

const lerp = MathUtils.lerp
const sm = (a: number, b: number, x: number) => MathUtils.clamp((x - a) / (b - a), 0, 1)

// Homography taking the (0,0)(W,0)(W,H)(0,H) rectangle onto four screen points, as a CSS matrix3d.
// Own projection instead of drei <Html transform>: that one painted ~60px off its layout box here.
function quadMatrix3d(p: number[][]) {
  const src = [[0, 0], [PX_W, 0], [PX_W, PX_H], [0, PX_H]]
  const A: number[][] = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i]
    const [u, v] = p[i]
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u, u])
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v, v])
  }
  for (let c = 0; c < 8; c++) {
    let m = c
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r
    ;[A[c], A[m]] = [A[m], A[c]]
    for (let r = 0; r < 8; r++) {
      if (r === c) continue
      const f = A[r][c] / A[c][c]
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k]
    }
  }
  const h = A.map((row, i) => row[8] / row[i])
  return `matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,1)`
}

type RigProps = Props & { visible: React.RefObject<boolean>; reduce: boolean; screenEl: React.RefObject<HTMLDivElement | null> }

function Rig({ progress, host, onReady, onFail, visible, reduce, screenEl }: RigProps) {
  const { invalidate, gl } = useThree()
  const group = useRef<Group>(null)
  const lid = useRef<Group>(null)
  const light = useRef<PointLight>(null)
  const prog = useRef(progress)
  const ptr = useRef({ x: 0, y: 0 })
  const cur = useRef({ yaw: -22, pitch: 3.5, scale: 1, y: 0, glow: 0 })
  const lightColor = useRef(new Color(GLOW.purple))
  const target = useRef(new Color())
  const v = useRef(new Vector3())
  const frames = useRef(0)
  const attached = useRef(false)

  const kick = () => visible.current && invalidate()

  useEffect(() => {
    prog.current = progress
    kick()
  }, [progress]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const move = (e: PointerEvent) => {
      ptr.current.x = (e.clientX / window.innerWidth) * 2 - 1
      ptr.current.y = (e.clientY / window.innerHeight) * 2 - 1
      kick()
    }
    if (!reduce) window.addEventListener('pointermove', move, { passive: true })
    const un = fx.subscribe(kick)
    const lost = (e: Event) => {
      e.preventDefault()
      onFail()
    }
    gl.domElement.addEventListener('webglcontextlost', lost)
    invalidate()
    return () => {
      window.removeEventListener('pointermove', move)
      un()
      gl.domElement.removeEventListener('webglcontextlost', lost)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, dt) => {
    const c = cur.current
    const p = prog.current
    // spec section 3 scroll table: 0-12% yaw -22 -> -6 and scale 1 -> 1.12; 12-84% held; 84-100% scale -> .92, drop 8%
    const a = sm(0, 0.12, p)
    const b = sm(0.84, 1, p)
    const f = fx.get()
    const t = reduce
      ? { yaw: -22, pitch: 3.5, scale: 1, y: 0, glow: f.glow ? 1 : 0 }
      : {
          yaw: lerp(-22, -6, a) + ptr.current.x * 6,
          pitch: 3.5 + ptr.current.y * 3,
          scale: lerp(lerp(1, 1.12, a), 0.92, b),
          y: -0.29 * b,
          glow: f.glow ? 1 : 0,
        }
    const d = Math.min(dt, 0.05)
    let moving = false
    for (const k of ['yaw', 'pitch', 'scale', 'y'] as const) {
      c[k] = MathUtils.damp(c[k], t[k], 6, d)
      if (Math.abs(c[k] - t[k]) > (k === 'scale' || k === 'y' ? 0.0005 : 0.01)) moving = true
    }
    c.glow = MathUtils.damp(c.glow, t.glow, 3, d)
    if (Math.abs(c.glow - t.glow) > 0.003) moving = true

    const g = group.current
    if (g) {
      g.rotation.set(c.pitch * D2R, c.yaw * D2R, 0)
      g.scale.setScalar(c.scale)
      g.position.y = c.y
      g.updateMatrixWorld(true)
    }
    if (light.current) {
      lightColor.current.lerp(target.current.set(GLOW[f.glow ?? 'purple']), 1 - Math.exp(-6 * d))
      light.current.color.copy(lightColor.current)
      light.current.intensity = 14 * c.glow
    }

    // pin the screen DOM onto the lid: project its four corners with the live camera
    const el = screenEl.current
    const l = lid.current
    if (el && l) {
      state.camera.updateMatrixWorld()
      const { width, height } = state.size
      const pts = [
        [-1, 1],
        [1, 1],
        [1, -1],
        [-1, -1],
      ].map(([sx, sy]) => {
        v.current.set((sx * SCREEN_W) / 2, -0.003, LID_Z + (sy * SCREEN_H) / 2)
        l.localToWorld(v.current).project(state.camera)
        return [((v.current.x + 1) / 2) * width, ((1 - v.current.y) / 2) * height]
      })
      el.style.transform = quadMatrix3d(pts)
      el.style.visibility = 'visible'
    }

    frames.current++
    // swap CSS -> 3D one frame after the first real frame so the screen is already pinned in place
    if (frames.current === 3 && !attached.current && el) {
      attached.current = true
      el.appendChild(host)
      requestAnimationFrame(onReady)
    }
    if ((moving && visible.current) || frames.current < 6) invalidate()
  })

  return (
    <group ref={group}>
      <Model lid={lid} />
      <pointLight ref={light} position={[0, 1.0, 2.8]} distance={6} decay={2} intensity={0} />
    </group>
  )
}

const alu = { color: '#5a5a63', metalness: 1, roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 3.2 } as const

function Model({ lid }: { lid: React.RefObject<Group | null> }) {
  return (
    <>
      {/* base */}
      <RoundedBox args={[3.04, 0.1, 2.12]} radius={0.05} smoothness={4}>
        <meshPhysicalMaterial {...alu} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0505, -0.4]}>
        <planeGeometry args={[2.6, 0.9]} />
        <meshPhysicalMaterial color="#0b0b0e" roughness={0.9} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0506, 0.58]}>
        <planeGeometry args={[1.2, 0.75]} />
        <meshPhysicalMaterial color="#1b1b20" roughness={0.35} metalness={0.6} />
      </mesh>
      {/* hinge */}
      <mesh position={[0, 0.045, -1.06]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 2.3, 24]} />
        <meshPhysicalMaterial color="#17171b" metalness={1} roughness={0.5} />
      </mesh>
      {/* lid, pivoted at the back edge of the base, open 105deg */}
      <group ref={lid} position={[0, 0.05, -1.06]} rotation={[-105 * D2R, 0, 0]}>
        <RoundedBox args={[3.04, 0.045, 2.12]} radius={0.022} smoothness={4} position={[0, 0.0225, LID_Z]}>
          <meshPhysicalMaterial {...alu} />
        </RoundedBox>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.001, LID_Z]}>
          <planeGeometry args={[2.94, 2.02]} />
          <meshPhysicalMaterial color="#050408" metalness={0} roughness={0.08} clearcoat={1} clearcoatRoughness={0.03} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.002, LID_Z]}>
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial color="#0d0916" />
        </mesh>
      </group>
    </>
  )
}

export default function Laptop3D(props: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  const screenEl = useRef<HTMLDivElement>(null)
  const visible = useRef(true)
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        frameloop="demand"
        dpr={[1, 1.75]}
        camera={{ fov: 28, position: [0, 1.25, 6], near: 1, far: 30 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ camera }) => camera.lookAt(0, 0.95, 0)}
      >
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={5} color="#ffffff" position={[-3, 3, 2]} scale={[4, 1.2, 1]} />
          <Lightformer form="rect" intensity={1.1} color="#d9d4ff" position={[0, 6, 1]} scale={[9, 6, 1]} />
          <Lightformer form="rect" intensity={7} color="#a78bff" position={[3, 1.5, -3]} scale={[0.4, 4, 1]} />
          <Lightformer form="rect" intensity={1.4} color="#cfc8ff" position={[0, -1, 4]} scale={[4, 1.5, 1]} />
        </Environment>
        <directionalLight position={[-2, 4, 3]} intensity={1.6} />
        <Rig {...props} visible={visible} reduce={reduce} screenEl={screenEl} />
      </Canvas>
      <div ref={screenEl} className="lap-3d-screen" style={{ width: PX_W, height: PX_H, visibility: 'hidden' }}>
        <div className="lap-notch"><i /></div>
      </div>
    </div>
  )
}
