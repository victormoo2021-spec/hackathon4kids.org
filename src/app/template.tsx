import * as React from 'react'

// Next's bundled React canary exports this; the installed @types/react does not.
const ViewTransition = (React as unknown as { unstable_ViewTransition: React.ComponentType<{ children: React.ReactNode }> })
  .unstable_ViewTransition

export default function Template({ children }: { children: React.ReactNode }) {
  return <ViewTransition>{children}</ViewTransition>
}
