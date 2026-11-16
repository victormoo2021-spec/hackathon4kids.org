import type { ReactNode } from 'react'

// Block label word, e.g. "say", "repeat". Decorative grammar around real content.
export default function Op({ children }: { children: ReactNode }) {
  return <span className="mr-2 font-display font-bold opacity-90">{children}</span>
}
