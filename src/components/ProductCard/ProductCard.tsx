import { useState } from 'react'
import type { Product } from '../../types'
import { formatCurrency } from '../../utils'
import { useCart } from '../../contexts/CartContext'
import './ProductCard.css'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCart()
  const [imgError, setImgError] = useState(false)
  const [added, setAdded] = useState(false)

  const isOutOfStock = product.stock === 0 || product.status === 'out_of_stock'
  const isInactive = !product.active || product.status === 'inactive'
  const isUnavailable = isOutOfStock || isInactive

  const cartItem = items.find((i) => i.productId === product.id)
  const cartQty = cartItem?.quantity ?? 0
  const maxReached = cartQty >= product.stock

  const categoryLabel =
    product.category === 'toucas' ? 'Touca Dupla Face' : 'Scrunchie de Cetim'

  function handleAddToCart() {
    if (isUnavailable || maxReached) return

    addItem({
      productId: product.id,
      name: product.name,
      category: product.category,
      color: product.color,
      size: product.size,
      price: product.price,
      imageUrl: product.imageUrl,
      quantity: 1,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <article className={`product-card ${isUnavailable ? 'product-card--unavailable' : ''}`}>
      {/* Imagem */}
      <div className="product-card__image-wrap">
        {product.imageUrl && !imgError ? (
          <img
            src={product.imageUrl}
            alt={`${product.name} — ${product.color}`}
            className="product-card__image"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="product-card__image-placeholder" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Sem foto</span>
          </div>
        )}

        {/* Badges sobre a imagem */}
        <div className="product-card__badges">
          {product.featured && (
            <span className="badge badge-featured">Destaque</span>
          )}
          {isOutOfStock && (
            <span className="badge badge-outofstock">Esgotado</span>
          )}
          {isInactive && !isOutOfStock && (
            <span className="badge badge-inactive">Indisponível</span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="product-card__body">
        <div className="product-card__category">{categoryLabel}</div>

        <h3 className="product-card__name">{product.name}</h3>

        <div className="product-card__meta">
          <span className="product-card__color">
            <span className="product-card__color-dot" aria-hidden="true" />
            {product.color}
          </span>
          {product.size && (
            <span className="product-card__size">Tam: {product.size}</span>
          )}
        </div>

        {product.description && (
          <p className="product-card__description">{product.description}</p>
        )}

        <div className="product-card__footer">
          <div className="product-card__price-area">
            <span className="product-card__price">{formatCurrency(product.price)}</span>
            {!isUnavailable && (
              <span className="product-card__stock">
                {product.stock} disponíve{product.stock === 1 ? 'l' : 'is'}
              </span>
            )}
          </div>

          <button
            id={`btn-add-cart-${product.id}`}
            onClick={handleAddToCart}
            disabled={isUnavailable || maxReached}
            className={`btn product-card__add-btn ${added ? 'product-card__add-btn--added' : ''}`}
            aria-label={
              isOutOfStock
                ? `${product.name} — Esgotado`
                : isInactive
                ? `${product.name} — Indisponível`
                : `Adicionar ${product.name} ao carrinho`
            }
          >
            {isOutOfStock ? (
              'Esgotado'
            ) : isInactive ? (
              'Indisponível'
            ) : maxReached ? (
              'Máx. no carrinho'
            ) : added ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Adicionado!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
                </svg>
                Adicionar ao carrinho
              </>
            )}
          </button>
        </div>

        {cartQty > 0 && (
          <p className="product-card__in-cart">
            ✓ {cartQty} {cartQty === 1 ? 'unidade' : 'unidades'} no carrinho
          </p>
        )}
      </div>
    </article>
  )
}
