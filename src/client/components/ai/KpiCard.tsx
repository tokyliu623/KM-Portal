import React from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: { value: number; isUp: boolean }
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'purple'
}

const colorMap: Record<NonNullable<KpiCardProps['color']>, string> = {
  blue: 'var(--accent-blue)',
  green: 'var(--accent-green)',
  orange: 'var(--accent-orange)',
  purple: 'var(--accent-purple)',
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, unit, trend, icon, color = 'blue' }) => {
  const c = colorMap[color]
  return (
    <div
      className="animate-item"
      style={{
        background: `linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-alt) 100%)`,
        border: `1px solid ${c}30`,
        borderRadius: 'var(--radius-md)',
        padding: 20,
        minHeight: 120,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: `radial-gradient(circle, ${c}20 0%, transparent 70%)`,
          borderRadius: '50%',
          transform: 'translate(20px, -20px)',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {icon && <span style={{ color: c, fontSize: 18 }}>{icon}</span>}
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{title}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ color: 'var(--text-primary)', fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          {value}
        </span>
        {unit && <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{unit}</span>}
      </div>
      {trend && (
        <div
          style={{
            color: trend.isUp ? 'var(--accent-green)' : 'var(--accent-red)',
            fontSize: 12,
            marginTop: 8,
          }}
        >
          {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  )
}
