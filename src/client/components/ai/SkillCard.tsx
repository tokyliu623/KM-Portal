import React from 'react'

interface SkillCardProps {
  name: string
  variant?: 'basic' | 'community'
  description?: string
  tag?: string
  onClick?: () => void
}

export const SkillCard: React.FC<SkillCardProps> = ({ name, variant = 'basic', description, tag, onClick }) => {
  const borderColor = variant === 'community' ? 'var(--accent-purple)' : 'var(--accent-blue)'
  return (
    <div
      className="animate-item"
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-sm)',
        padding: 16,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = `0 4px 12px ${borderColor}40`
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{name}</div>
        {tag && (
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background: borderColor,
              color: 'var(--bg-primary)',
            }}
          >
            {tag}
          </span>
        )}
      </div>
      {description && (
        <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
          {description}
        </div>
      )}
    </div>
  )
}
