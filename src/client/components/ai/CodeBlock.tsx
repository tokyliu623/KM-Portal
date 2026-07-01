import React from 'react'

interface CodeBlockProps {
  code: string
  language?: string
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  return (
    <pre
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: 16,
        overflow: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--text-primary)',
        lineHeight: 1.6,
        maxHeight: 400,
      }}
    >
      {language && (
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: 10,
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          {language}
        </div>
      )}
      <code>{code}</code>
    </pre>
  )
}
