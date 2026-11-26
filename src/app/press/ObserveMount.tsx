'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { observe } from './observe'

export default function Observe() {
  const path = usePathname()
  useEffect(() => observe(), [path])
  return null
}
