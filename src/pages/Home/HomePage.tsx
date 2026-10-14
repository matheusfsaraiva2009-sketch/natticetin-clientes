import { useSettings } from '../../contexts/SettingsContext'
import { useProductsByCategory } from '../../hooks/useProducts'
import { ProductGrid } from '../../components/ProductGrid/ProductGrid'
import { ProductCard } from '../../components/ProductCard/ProductCard'
import './HomePage.css'

export function HomePage() {
  const { settings } = useSettings()
  const { products: toucas, isLoading: loadingToucas, error: errorToucas } = useProductsByCategory('toucas')
  const { products: scrunchies, isLoading: loadingScrunchies, error: errorScrunchies } = useProductsByCategory('scrunchies')

  const featuredProducts = [...toucas, ...scrunchies].filter((p) => p.featured)

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main>
      {/* ── Hero ── */}
      <section className="hero" aria-labelledby="hero-title">
        {settings.heroImageUrl && (
          <div className="hero__image-wrap" aria-hidden="true">
            <img
              src={settings.heroImageUrl}
              alt="Imagem de apresentação da loja"
              className="hero__bg-image"
            />
            <div className="hero__overlay" />
          </div>
        )}

        <div className={`hero__content ${!settings.heroImageUrl ? 'hero__content--no-image' : ''}`}>
          <div className="container">
            <div className="hero__text">
              <p className="hero__eyebrow">Acessórios de cetim</p>
              <h1 id="hero-title" className="hero__title">
                {settings.heroTitle || 'Cuide do seu cabelo com elegância'}
              </h1>
              <p className="hero__subtitle">
                {settings.heroSubtitle || 'Toucas dupla face e scrunchies de cetim que protegem e embelezam.'}
              </p>
              <div className="hero__actions">
                <button
                  onClick={() => scrollToSection('toucas')}
                  className="btn btn-primary btn-lg"
                  id="btn-hero-toucas"
                >
                  Ver Toucas
                </button>
                <button
                  onClick={() => scrollToSection('scrunchies')}
                  className="btn btn-secondary btn-lg hero__btn-scrunchies"
                  id="btn-hero-scrunchies"
                >
                  Ver Scrunchies
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Diferenciais ── */}
      <section className="features section-sm" aria-label="Diferenciais da loja">
        <div className="container">
          <div className="features__grid">
            <div className="feature-item">
              <h3 className="feature-item__title">Proteção noturna</h3>
              <p className="feature-item__text">Toucas dupla face que protegem o cabelo enquanto você dorme</p>
            </div>
            <div className="feature-item">
              <h3 className="feature-item__title">Cetim de qualidade</h3>
              <p className="feature-item__text">Tecido que reduz o frizz e mantém a hidratação dos fios</p>
            </div>
            <div className="feature-item">
              <h3 className="feature-item__title">Design elegante</h3>
              <p className="feature-item__text">Peças que combinam funcionalidade com estética refinada</p>
            </div>
            <div className="feature-item">
              <h3 className="feature-item__title">Pedido pelo WhatsApp</h3>
              <p className="feature-item__text">Atendimento personalizado direto com a loja</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Destaques ── */}
      {featuredProducts.length > 0 && (
        <section className="featured-section section" aria-labelledby="featured-title">
          <div className="container">
            <div className="featured-section__header">
              <h2 id="featured-title" className="featured-section__title">Em destaque</h2>
              <p className="featured-section__subtitle">Selecionados especialmente para você</p>
            </div>
            <div className="featured-section__grid">
              {featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Toucas ── */}
      <ProductGrid
        products={toucas}
        isLoading={loadingToucas}
        error={errorToucas}
        title="Toucas Dupla Face"
        subtitle="Proteção e elegância para o seu cabelo"
        id="toucas"
        emptyMessage="As toucas dupla face estarão disponíveis em breve. Siga nosso Instagram para novidades!"
      />

      {/* ── Scrunchies ── */}
      <ProductGrid
        products={scrunchies}
        isLoading={loadingScrunchies}
        error={errorScrunchies}
        title="Scrunchies de Cetim"
        subtitle="Delicadeza e estilo para o seu dia a dia"
        id="scrunchies"
        emptyMessage="Os scrunchies de cetim estarão disponíveis em breve. Volte em breve!"
      />

      {/* ── CTA WhatsApp ── */}
      {settings.whatsappNumber && (
        <section className="cta-section" aria-labelledby="cta-title">
          <div className="container">
            <div className="cta-section__inner">
              <div className="cta-section__text">
                <h2 id="cta-title" className="cta-section__title">Dúvidas ou pedidos especiais?</h2>
                <p className="cta-section__subtitle">
                  Entre em contato pelo WhatsApp e faremos o atendimento personalizado que você merece.
                </p>
              </div>
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
                id="btn-cta-whatsapp"
                aria-label="Falar pelo WhatsApp"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Falar pelo WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
