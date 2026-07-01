import React from 'react'

interface AgentCardProps {
  title: string
  subtitle?: string
  variant?: 'main' | 'sub'
  icon?: React.ReactNode
  children?: React.ReactNode
}

export const AgentCard: React.FC<AgentCardProps> = ({ title, subtitle, variant = 'main', icon, children }) => {
  const borderColor = variant === 'main' ? 'var(--accent-blue)' : 'var(--accent-green)'
  return (
    <div
      className="animate-item"
      style={{
        background: `linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-alt) 100%)`,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-md)',
        padding: 20,
        minWidth: 220,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {icon && <span style={{ color: borderColor, fontSize: 20 }}>{icon}</span>}
        <div>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>{title}</div>
          {subtitle && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
