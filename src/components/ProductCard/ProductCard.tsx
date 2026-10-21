import { useState, useEffect, useCallback } from 'react'
import type { Product, SizeVariant } from '../../types'
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
  const [showQtyModal, setShowQtyModal] = useState(false)
  const [modalQty, setModalQty] = useState(1)

  const hasVariants = product.variants && product.variants.length > 0

  // Tamanho selecionado (variante ou fallback)
  const [selectedVariant, setSelectedVariant] = useState<SizeVariant | null>(
    hasVariants ? product.variants[0] : null
  )

  // Dados ativos (variant ou produto direto)
  const activePrice = selectedVariant ? selectedVariant.price : product.price
  const activeWholesalePrice = selectedVariant
    ? selectedVariant.wholesalePrice
    : product.wholesalePrice
  const activeWholesaleMinQty = selectedVariant
    ? selectedVariant.wholesaleMinQty
    : product.wholesaleMinQty
  const activeSize = selectedVariant ? selectedVariant.size : product.size
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock

  const isOutOfStock = activeStock === 0 || product.status === 'out_of_stock'
  const isInactive = !product.active || product.status === 'inactive'
  const isUnavailable = isOutOfStock || isInactive

  // Chave única no carrinho: productId + size (para permitir M e G separados)
  const cartKey = `${product.id}__${activeSize}`
  const cartItem = items.find((i) => i.productId === cartKey)
  const cartQty = cartItem?.quantity ?? 0
  const maxReached = cartQty >= activeStock

  const maxAllowedQty = Math.max(0, activeStock - cartQty)

  function handleOpenModal() {
    if (isUnavailable || maxReached) return
    setModalQty(1)
    setShowQtyModal(true)
  }

  const handleCloseModal = useCallback(() => {
    setShowQtyModal(false)
  }, [])

  // Fecha com ESC
  useEffect(() => {
    if (!showQtyModal) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleCloseModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showQtyModal, handleCloseModal])

  function handleConfirmQty() {
    if (modalQty < 1 || modalQty > maxAllowedQty) return

    addItem({
      productId: cartKey,
      name: product.name,
      category: product.category,
      color: product.color,
      size: activeSize,
      price: activePrice,
      ...(activeWholesalePrice != null && { wholesalePrice: activeWholesalePrice }),
      ...(activeWholesaleMinQty != null && { wholesaleMinQty: activeWholesaleMinQty }),
      imageUrl: product.imageUrl,
      quantity: modalQty,
    })

    setShowQtyModal(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
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

        {/* Badges */}
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
        <div className="product-card__meta">
          <span className="product-card__color">{product.color}</span>
        </div>

        {product.description && (
          <p className="product-card__description">{product.description}</p>
        )}

        {/* Seletor de tamanho (variantes) */}
        {hasVariants && (
          <div className="product-card__variants">
            <p className="product-card__variants-label">Tamanho</p>
            <div className="product-card__size-buttons">
              {product.variants.map((v) => {
                const variantEmpty = v.stock === 0
                const isSelected = selectedVariant?.size === v.size
                return (
                  <button
                    key={v.size}
                    type="button"
                    onClick={() => !variantEmpty && setSelectedVariant(v)}
                    disabled={variantEmpty}
                    className={`size-btn ${isSelected ? 'size-btn--active' : ''} ${variantEmpty ? 'size-btn--empty' : ''}`}
                    aria-label={`Tamanho ${v.size}${variantEmpty ? ' — esgotado' : ''}`}
                    id={`btn-size-${product.id}-${v.size}`}
                  >
                    {v.size}
                    {variantEmpty && <span className="size-btn__line" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
            {selectedVariant && (
              <p className="product-card__variant-stock">
                {activeStock > 0
                  ? `${activeStock} disponíve${activeStock === 1 ? 'l' : 'is'}`
                  : 'Esgotado'}
              </p>
            )}
          </div>
        )}

        {/* Footer: preço + botão */}
        <div className="product-card__footer">
          <div className="product-card__price-area">
            <span className="product-card__price">{formatCurrency(activePrice)}</span>
            {!hasVariants && !isUnavailable && (
              <span className="product-card__stock">
                {activeStock} disponíve{activeStock === 1 ? 'l' : 'is'}
              </span>
            )}
            {activeWholesalePrice != null && activeWholesalePrice > 0 && activeWholesaleMinQty != null && (
              <span className="product-card__wholesale">
                A partir de {activeWholesaleMinQty} un.: {formatCurrency(activeWholesalePrice)}
              </span>
            )}
          </div>

          <button
            id={`btn-add-cart-${product.id}-${activeSize}`}
            onClick={handleOpenModal}
            disabled={isUnavailable || maxReached}
            className={`btn product-card__add-btn ${added ? 'product-card__add-btn--added' : ''}`}
            aria-label={
              isOutOfStock
                ? `${product.name} — Esgotado`
                : isInactive
                ? `${product.name} — Indisponível`
                : `Adicionar ${product.name} (${activeSize}) ao carrinho`
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
                Adicionar
              </>
            )}
          </button>

          {/* ── Modal de Quantidade ── */}
          {showQtyModal && (
            <div
              className="qty-modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Selecionar quantidade"
              onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal() }}
            >
              <div className="qty-modal">
                <button
                  className="qty-modal__close"
                  onClick={handleCloseModal}
                  aria-label="Fechar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>

                <div className="qty-modal__header">
                  {product.imageUrl && !imgError && (
                    <img src={product.imageUrl} alt={product.name} className="qty-modal__thumb" />
                  )}
                  <div>
                    <p className="qty-modal__name">{product.name}</p>
                    <p className="qty-modal__info">
                      {product.color}
                      {activeSize ? ` · ${activeSize}` : ''}
                    </p>
                    <p className="qty-modal__price">{formatCurrency(activePrice)}</p>
                  </div>
                </div>

                <div className="qty-modal__body">
                  <p className="qty-modal__label">Quantidade</p>
                  <div className="qty-modal__controls">
                    <button
                      className="qty-modal__btn"
                      onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                      disabled={modalQty <= 1}
                      aria-label="Diminuir quantidade"
                    >−</button>
                    <input
                      id={`qty-input-${product.id}-${activeSize}`}
                      type="number"
                      className="qty-modal__input"
                      value={modalQty}
                      min={1}
                      max={maxAllowedQty}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (!isNaN(v)) setModalQty(Math.min(maxAllowedQty, Math.max(1, v)))
                      }}
                      aria-label="Quantidade"
                    />
                    <button
                      className="qty-modal__btn"
                      onClick={() => setModalQty((q) => Math.min(maxAllowedQty, q + 1))}
                      disabled={modalQty >= maxAllowedQty}
                      aria-label="Aumentar quantidade"
                    >+</button>
                  </div>
                  <p className="qty-modal__stock-info">
                    {maxAllowedQty} disponíve{maxAllowedQty === 1 ? 'l' : 'is'}
                    {cartQty > 0 ? ` · ${cartQty} já no carrinho` : ''}
                  </p>
                </div>

                <button
                  className="qty-modal__confirm"
                  onClick={handleConfirmQty}
                  disabled={modalQty < 1 || modalQty > maxAllowedQty}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
                  </svg>
                  Adicionar {modalQty} ao carrinho
                </button>
              </div>
            </div>
          )}
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
