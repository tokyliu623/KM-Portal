import React from 'react'

interface FlowArrowProps {
  label?: string
  direction?: 'right' | 'down'
}

export const FlowArrow: React.FC<FlowArrowProps> = ({ label, direction = 'right' }) => {
  const isDown = direction === 'down'
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isDown ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 12,
        padding: isDown ? '8px 0' : '0 8px',
      }}
    >
      <div style={{ position: 'relative' }}>
        <svg width={isDown ? 24 : 48} height={isDown ? 24 : 16} viewBox={isDown ? '0 0 24 24' : '0 0 48 16'}>
          <line
            x1={isDown ? 12 : 0}
            y1={isDown ? 0 : 8}
            x2={isDown ? 12 : 44}
            y2={isDown ? 18 : 8}
            stroke="var(--accent-blue)"
            strokeWidth={2}
            strokeDasharray="4 4"
            style={{ animation: 'flow 1.5s linear infinite' }}
          />
          <polygon
            points={isDown ? '6,18 18,18 12,24' : '40,4 48,8 40,12'}
            fill="var(--accent-blue)"
          />
        </svg>
      </div>
      {label && <div style={{ marginTop: isDown ? 4 : 0, marginLeft: isDown ? 0 : 4 }}>{label}</div>}
    </div>
  )
}
