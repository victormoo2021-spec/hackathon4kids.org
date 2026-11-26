'use client'
import { useEffect, useRef } from 'react'
import type { Course } from '../../content/courses'
import { fields, rest } from './fields'
import { paintProof } from './paint2d'

// Frame-0 proof, Canvas2D only (no GL, no ticker, no link). For /programs and /about.
export default function ProofStatic({ name, size = 96, paper = '#111114', ink = '#F2EDE1', ghost = '#1F3FCF', yellow = '#FFD60A', className }: {
  name: Course; size?: number; paper?: string; ink?: string; ghost?: string; yellow?: string; className?: string
}) {
  const cv = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = cv.current!, dpr = Math.min(devicePixelRatio || 1, 2), w = Math.round(size * dpr)
    c.width = c.height = w
    paintProof(c.getContext('2d')!, w, w, fields[name](rest[name]), { paper, ink, ghost, yellow }, 0, 1, dpr)
  }, [name, size, paper, ink, ghost, yellow])
  return <canvas ref={cv} aria-hidden className={className} style={{ display: 'block', width: size, height: size }} />
}
