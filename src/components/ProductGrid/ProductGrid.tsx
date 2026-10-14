import { useState, useMemo } from 'react'
import { ProductCard } from '../ProductCard/ProductCard'
import type { Product } from '../../types'
import './ProductGrid.css'

interface ProductGridProps {
  products: Product[]
  isLoading: boolean
  error: string | null
  title: string
  subtitle?: string
  id: string
  emptyMessage?: string
}

export function ProductGrid({
  products,
  isLoading,
  error,
  title,
  subtitle,
  id,
  emptyMessage = 'Os produtos desta categoria estarão disponíveis em breve.',
}: ProductGridProps) {
  const [search, setSearch] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'out_of_stock'>('all')

  // Extrai cores únicas dos produtos
  const uniqueColors = useMemo(() => {
    const colors = products.map((p) => p.color).filter(Boolean)
    return Array.from(new Set(colors)).sort()
  }, [products])

  // Filtra produtos
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.color.toLowerCase().includes(search.toLowerCase())

      const matchColor = colorFilter === '' || p.color === colorFilter

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' && p.stock > 0 && p.status !== 'out_of_stock') ||
        (statusFilter === 'out_of_stock' && (p.stock === 0 || p.status === 'out_of_stock'))

      return matchSearch && matchColor && matchStatus
    })
  }, [products, search, colorFilter, statusFilter])

  const hasFilters = search !== '' || colorFilter !== '' || statusFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setColorFilter('')
    setStatusFilter('all')
  }

  if (isLoading) {
    return (
      <section className="product-grid-section" id={id}>
        <div className="container">
          <div className="product-grid__header">
            <h2 className="product-grid__title">{title}</h2>
          </div>
          <div className="loading-overlay">
            <div className="spinner spinner-lg" aria-label="Carregando produtos" />
            <span>Carregando produtos...</span>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="product-grid-section" id={id}>
        <div className="container">
          <div className="product-grid__header">
            <h2 className="product-grid__title">{title}</h2>
          </div>
          <div className="alert alert-error" role="alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="product-grid-section" id={id}>
      <div className="container">
        {/* Cabeçalho da seção */}
        <div className="product-grid__header">
          <div>
            <h2 className="product-grid__title">{title}</h2>
            {subtitle && <p className="product-grid__subtitle">{subtitle}</p>}
          </div>
          {products.length > 0 && (
            <span className="product-grid__count">
              {filtered.length} produto{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Layout sidebar + grid */}
        <div className="product-grid__layout">

          {/* ── Sidebar de filtros ── */}
          {products.length > 0 && (
            <aside className="product-grid__sidebar" aria-label="Filtros">

              {/* Filtro por Cor */}
              <div className="product-grid__filter-group">
                <div className="product-grid__filter-title">Filtrar por Cor</div>
                <label className="product-grid__filter-option">
                  <input
                    type="radio"
                    name={`color-${id}`}
                    checked={colorFilter === ''}
                    onChange={() => setColorFilter('')}
                  />
                  Todas as cores
                </label>
                {uniqueColors.map((color) => (
                  <label
                    key={color}
                    className={`product-grid__filter-option ${colorFilter === color ? 'product-grid__filter-option--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`color-${id}`}
                      checked={colorFilter === color}
                      onChange={() => setColorFilter(color)}
                    />
                    {color}
                  </label>
                ))}
              </div>

              {/* Filtro por Disponibilidade */}
              <div className="product-grid__filter-group">
                <div className="product-grid__filter-title">Disponibilidade</div>
                {([
                  { value: 'all', label: 'Todos' },
                  { value: 'available', label: 'Disponíveis' },
                  { value: 'out_of_stock', label: 'Esgotados' },
                ] as const).map(({ value, label }) => (
                  <label
                    key={value}
                    className={`product-grid__filter-option ${statusFilter === value ? 'product-grid__filter-option--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`status-${id}`}
                      checked={statusFilter === value}
                      onChange={() => setStatusFilter(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>

              {/* Limpar filtros */}
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="product-grid__clear-btn"
                  id={`btn-clear-filters-${id}`}
                >
                  Limpar filtros
                </button>
              )}
            </aside>
          )}

          {/* ── Área principal ── */}
          <div className="product-grid__main">

            {/* Barra de busca + ordenação */}
            {products.length > 0 && (
              <div className="product-grid__topbar" role="search" aria-label="Buscar produtos">
                <div className="product-grid__search-wrap">
                  <svg className="product-grid__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input
                    type="search"
                    id={`search-${id}`}
                    placeholder="Buscar por nome ou cor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="product-grid__search"
                    aria-label="Pesquisar produtos"
                  />
                </div>
              </div>
            )}

            {/* Grid de produtos */}
            {products.length === 0 ? (
              <div className="product-grid__empty">
                <div className="product-grid__empty-icon" aria-hidden="true">✨</div>
                <h3>Em breve</h3>
                <p>{emptyMessage}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="product-grid__empty">
                <div className="product-grid__empty-icon" aria-hidden="true">🔍</div>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente outros termos ou{' '}
                  <button onClick={clearFilters} className="product-grid__clear-link">
                    limpe os filtros
                  </button>
                </p>
              </div>
            ) : (
              <div className="product-grid__grid" role="list" aria-label={`Lista de ${title}`}>
                {filtered.map((product, index) => (
                  <div
                    key={product.id}
                    role="listitem"
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
