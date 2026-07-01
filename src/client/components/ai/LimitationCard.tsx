import React from 'react'

type LimitationColor = 'red' | 'orange' | 'yellow' | 'blue'

interface LimitationCardProps {
  title: string
  description: string
  improvement?: string
  color?: LimitationColor
}

const colorMap: Record<LimitationColor, string> = {
  red: 'var(--accent-red)',
  orange: 'var(--accent-orange)',
  yellow: 'var(--accent-orange)',
  blue: 'var(--accent-blue)',
}

export const LimitationCard: React.FC<LimitationCardProps> = ({
  title,
  description,
  improvement,
  color = 'orange',
}) => {
  const c = colorMap[color]
  return (
    <div
      className="animate-item"
      style={{
        background: 'var(--bg-card)',
        borderLeft: `4px solid ${c}`,
        borderRadius: 'var(--radius-sm)',
        padding: 16,
      }}
    >
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>{description}</div>
      {improvement && (
        <div
          style={{
            color: c,
            fontSize: 12,
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid var(--border)',
          }}
        >
          → {improvement}
        </div>
      )}
    </div>
  )
}
