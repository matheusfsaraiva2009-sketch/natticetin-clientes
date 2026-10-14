import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { signIn } from '../../services/auth'
import './LoginPage.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { user, isAdmin, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redireciona se já estiver autenticada como admin
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      navigate('/admin', { replace: true })
    }
  }, [user, isAdmin, authLoading, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return

    setError('')
    setIsLoading(true)

    try {
      await signIn(email.trim(), password)
      // O AuthContext vai verificar se é admin e redirecionar
    } catch (err: unknown) {
      const firebaseError = err as { code?: string }
      switch (firebaseError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('E-mail ou senha incorretos. Verifique suas credenciais.')
          break
        case 'auth/too-many-requests':
          setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
          break
        case 'auth/network-request-failed':
          setError('Erro de conexão. Verifique sua internet.')
          break
        default:
          setError('Erro ao entrar. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="login-page login-page--loading">
        <div className="spinner spinner-lg" role="status" aria-label="Carregando..." />
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-page__left" aria-hidden="true">
        <div className="login-page__left-content">
          <div className="login-page__brand-icon">V</div>
          <h2 className="login-page__brand-title">Val Acessórios</h2>
          <p className="login-page__brand-subtitle">Painel Administrativo</p>
          <div className="login-page__decorations">
            <div className="login-page__dec login-page__dec--1" />
            <div className="login-page__dec login-page__dec--2" />
            <div className="login-page__dec login-page__dec--3" />
          </div>
        </div>
      </div>

      <main className="login-page__right">
        <div className="login-card">
          <div className="login-card__header">
            <h1 className="login-card__title">Entrar</h1>
            <p className="login-card__subtitle">
              Acesso exclusivo para a proprietária
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-card__form" noValidate>
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="seu@email.com"
                autoComplete="email"
                autoFocus
                required
                disabled={isLoading}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Senha
              </label>
              <div className="login-card__password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input login-card__password-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-card__show-pw"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div id="login-error" className="alert alert-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg login-card__submit"
              disabled={isLoading || !email.trim() || !password}
              id="btn-login-submit"
            >
              {isLoading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Entrando...
                </>
              ) : (
                'Entrar no painel'
              )}
            </button>
          </form>

          <div className="login-card__footer">
            <a href="/" className="login-card__back-link">
              ← Voltar ao catálogo
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
