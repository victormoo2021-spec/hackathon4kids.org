'use client'
// Compat shim for the old tile component: Sections.tsx should move to <Proof/>; until then this paints the 2D frame 0.
import type { Course } from '../../content/courses'
import ProofStatic from './ProofStatic'

export default function Halftone({ name, fg, ghost }: { name: string; fg: string; ghost: string }) {
  return <ProofStatic name={name as Course} size={169} ink={fg} ghost={ghost} />
}
