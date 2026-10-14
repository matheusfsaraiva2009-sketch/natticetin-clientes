import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        background: 'var(--bg-primary)',
        gap: '1.5rem',
      }}
    >
      <div style={{ fontSize: '4rem' }}>🌸</div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 400,
          color: 'var(--color-espresso)',
        }}
      >
        Página não encontrada
      </h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: '400px', fontSize: 'var(--text-lg)' }}>
        A página que você procura não existe ou foi movida.
      </p>
      <Link to="/" className="btn btn-primary btn-lg">
        Voltar ao catálogo
      </Link>
    </div>
  )
}
