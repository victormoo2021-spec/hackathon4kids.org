'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { scene } from './index'

export default function Motion() {
  const path = usePathname()
  useEffect(() => scene(document.getElementById('main'), (k, c, ctx) => k.dom(c, ctx)), [path])
  return null
}
