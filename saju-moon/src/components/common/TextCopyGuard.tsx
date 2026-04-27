'use client'

import type { PropsWithChildren } from 'react'

interface TextCopyGuardProps extends PropsWithChildren {
  className?: string
}

export default function TextCopyGuard({ children, className }: TextCopyGuardProps) {
  const preventDefault = (event: { preventDefault: () => void }) => {
    event.preventDefault()
  }

  return (
    <div
      className={className}
      onCopy={preventDefault}
      onCut={preventDefault}
      onContextMenu={preventDefault}
      onDragStart={preventDefault}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      {children}
    </div>
  )
}
