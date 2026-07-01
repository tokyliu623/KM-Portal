import React from 'react'

type PulseColor = 'green' | 'orange' | 'red' | 'blue'

interface PulseDotProps {
  color?: PulseColor
  size?: number
  label?: string
}

const colorMap: Record<PulseColor, string> = {
  green: 'var(--accent-green)',
  orange: 'var(--accent-orange)',
  red: 'var(--accent-red)',
  blue: 'var(--accent-blue)',
}

export const PulseDot: React.FC<PulseDotProps> = ({ color = 'green', size = 10, label }) => {
  const c = colorMap[color]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        className="pulse-dot"
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          borderRadius: '50%',
          background: c,
          boxShadow: `0 0 8px ${c}`,
        }}
      />
      {label && <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{label}</span>}
    </span>
  )
}
