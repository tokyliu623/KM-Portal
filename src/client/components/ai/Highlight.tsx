import React from 'react'

type HighlightColor = 'blue' | 'green' | 'orange' | 'purple' | 'red'

interface HighlightProps {
  color?: HighlightColor
  children: React.ReactNode
}

const colorMap: Record<HighlightColor, string> = {
  blue: 'var(--accent-blue)',
  green: 'var(--accent-green)',
  orange: 'var(--accent-orange)',
  purple: 'var(--accent-purple)',
  red: 'var(--accent-red)',
}

export const Highlight: React.FC<HighlightProps> = ({ color = 'blue', children }) => {
  const c = colorMap[color]
  return (
    <span
      style={{
        background: `${c}20`,
        color: c,
        padding: '1px 6px',
        borderRadius: 4,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  )
}
