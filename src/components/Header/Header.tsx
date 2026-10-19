import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { useSettings } from '../../contexts/SettingsContext'
import './Header.css'

interface HeaderProps {
  onCartOpen: () => void
}

export function Header({ onCartOpen }: HeaderProps) {
  const { totalItems } = useCart()
  const { settings } = useSettings()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fecha menu mobile ao navegar
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  const navLinks = [
    { href: '/#toucas', label: 'Toucas' },
    { href: '/#scrunchies', label: 'Scrunchies' },
  ]

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
      <div className="container header__inner">
        {/* Logo / Brand */}
        <Link to="/" className="header__brand">
          <img
            src="/logo-nati-cetim.png"
            alt="Logo Nati Cetim"
            className="header__logo"
          />
        </Link>

        {/* Nav desktop */}
        <nav className="header__nav" aria-label="Navegação principal">
          <ul className="header__nav-list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="header__nav-link">
                  {link.label}
                </a>
              </li>
            ))}
            {settings.instagramUrl && (
              <li>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="header__nav-link header__nav-link--instagram"
                  aria-label="Visitar Instagram"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  {settings.instagramHandle && (
                    <span className="hide-mobile">{settings.instagramHandle}</span>
                  )}
                </a>
              </li>
            )}
          </ul>
        </nav>

        {/* Ações do header */}
        <div className="header__actions">
          {/* WhatsApp */}
          {settings.whatsappNumber && (
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm header__whatsapp hide-mobile"
              aria-label="Falar pelo WhatsApp"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>WhatsApp</span>
            </a>
          )}

          {/* Carrinho */}
          <button
            onClick={onCartOpen}
            className="header__cart-btn"
            aria-label={`Carrinho — ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`}
            id="btn-open-cart"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {totalItems > 0 && (
              <span className="header__cart-count" aria-live="polite">
                {totalItems}
              </span>
            )}
          </button>

          {/* Botão menu mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="header__mobile-toggle"
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMobileMenuOpen}
            id="btn-mobile-menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'is-open' : ''}`}>
              <span /><span /><span />
            </span>
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <div
        className={`header__mobile-menu ${isMobileMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <nav aria-label="Menu mobile">
          <ul className="header__mobile-nav">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="header__mobile-link">
                  {link.label}
                </a>
              </li>
            ))}
            {settings.instagramUrl && (
              <li>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="header__mobile-link"
                >
                  Instagram
                </a>
              </li>
            )}
            {settings.whatsappNumber && (
              <li>
                <a
                  href={`https://wa.me/${settings.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="header__mobile-link header__mobile-link--whatsapp"
                >
                  Falar pelo WhatsApp
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}
