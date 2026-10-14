import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Protege rotas administrativas.
 * - Se ainda carregando: mostra spinner
 * - Se não autenticado: redireciona para /login
 * - Se autenticado mas não é admin: mostra acesso negado
 * - Se é admin: renderiza o conteúdo
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAdmin, isLoading, adminChecked } = useAuth()

  // Aguarda a verificação de autenticação + admin
  if (isLoading || !adminChecked) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '1rem',
          background: 'var(--bg-primary)',
        }}
        role="status"
        aria-label="Verificando acesso..."
      >
        <div className="spinner spinner-lg" />
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          Verificando acesso...
        </p>
      </div>
    )
  }

  // Não autenticado → login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Autenticado mas não é admin → acesso negado
  if (!isAdmin) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '1.5rem',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--bg-primary)',
        }}
        role="alert"
      >
        <div style={{ fontSize: '3rem' }}>🚫</div>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-espresso)' }}>
          Acesso negado
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '360px' }}>
          Você não tem permissão para acessar o painel administrativo.
          Se você é a proprietária, verifique se está usando a conta correta.
        </p>
        <a href="/" className="btn btn-primary">
          Voltar ao catálogo
        </a>
      </div>
    )
  }

  return <>{children}</>
}
