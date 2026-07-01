import React from 'react'

interface SectionTagProps {
  index?: string | number
  label: string
  englishLabel?: string
}

export const SectionTag: React.FC<SectionTagProps> = ({ index, label, englishLabel }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'linear-gradient(90deg, var(--bg-card-alt), transparent)',
        borderLeft: '3px solid var(--accent-blue)',
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      {index !== undefined && (
        <span
          style={{
            color: 'var(--accent-blue)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {String(index).padStart(2, '0')}
        </span>
      )}
      <span style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600 }}>{label}</span>
      {englishLabel && (
        <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
          {englishLabel}
        </span>
      )}
    </div>
  )
}
