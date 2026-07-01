import React from 'react'

type FlowColor = 'blue' | 'orange' | 'green' | 'purple'

interface FlowNodeProps {
  color?: FlowColor
  title: string
  subtitle?: string
  icon?: React.ReactNode
  active?: boolean
}

const colorMap: Record<FlowColor, string> = {
  blue: 'var(--accent-blue)',
  orange: 'var(--accent-orange)',
  green: 'var(--accent-green)',
  purple: 'var(--accent-purple)',
}

export const FlowNode: React.FC<FlowNodeProps> = ({ color = 'blue', title, subtitle, icon, active }) => {
  const c = colorMap[color]
  return (
    <div
      className="animate-item"
      style={{
        background: 'var(--bg-card)',
        border: `2px solid ${active ? c : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        minWidth: 160,
        boxShadow: active ? `0 0 16px ${c}40` : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      {icon && <div style={{ color: c, fontSize: 24, marginBottom: 8 }}>{icon}</div>}
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{title}</div>
      {subtitle && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  )
}
