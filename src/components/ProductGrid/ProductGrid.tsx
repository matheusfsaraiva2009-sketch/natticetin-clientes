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
        {/* Header da seção */}
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

        {/* Filtros */}
        {products.length > 0 && (
          <div className="product-grid__filters" role="search" aria-label="Filtrar produtos">
            <div className="product-grid__search-wrap">
              <svg className="product-grid__search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="search"
                id={`search-${id}`}
                placeholder="Pesquisar por nome ou cor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="product-grid__search"
                aria-label="Pesquisar produtos"
              />
            </div>

            <select
              id={`color-filter-${id}`}
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              className="form-select product-grid__select"
              aria-label="Filtrar por cor"
            >
              <option value="">Todas as cores</option>
              {uniqueColors.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>

            <select
              id={`status-filter-${id}`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="form-select product-grid__select"
              aria-label="Filtrar por disponibilidade"
            >
              <option value="all">Todos</option>
              <option value="available">Disponíveis</option>
              <option value="out_of_stock">Esgotados</option>
            </select>

            {hasFilters && (
              <button onClick={clearFilters} className="btn btn-ghost btn-sm" id={`btn-clear-filters-${id}`}>
                Limpar filtros
              </button>
            )}
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
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
