import { useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { useSettings } from '../../contexts/SettingsContext'
import { formatCurrency, generateWhatsappMessage, openWhatsapp } from '../../utils'
import { validateCartItems } from '../../services/products'
import { createOrder } from '../../services/orders'
import type { CartItem } from '../../types'
import './CartDrawer.css'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

type CartStep = 'cart' | 'review'

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart, updateItemsFromValidation } = useCart()
  const { settings } = useSettings()
  const [step, setStep] = useState<CartStep>('cart')
  const [isValidating, setIsValidating] = useState(false)
  const [isSendingOrder, setIsSendingOrder] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  async function handleProceedToReview() {
    if (items.length === 0) return

    setIsValidating(true)
    setValidationErrors([])

    try {
      const results = await validateCartItems(
        items.map((i) => ({
          productId: i.productId,
          price: i.price,
          quantity: i.quantity,
        }))
      )

      const errors: string[] = []
      const updatedItems: CartItem[] = [...items]

      results.forEach((result, index) => {
        if (!result.valid) {
          errors.push(`"${items[index].name}": ${result.reason}`)
          // Se o produto tem dados atualizados, atualiza o item
          if (result.currentProduct && result.reason?.includes('Preço atualizado')) {
            updatedItems[index] = {
              ...updatedItems[index],
              price: result.currentProduct.price,
            }
          }
        }
      })

      if (errors.length > 0) {
        // Remove itens inválidos sem produto
        const invalidIds = results
          .filter((r) => !r.valid && !r.currentProduct)
          .map((r) => r.productId)

        const validItems = updatedItems.filter((i) => !invalidIds.includes(i.productId))
        updateItemsFromValidation(validItems)
        setValidationErrors(errors)
        return
      }

      setStep('review')
    } catch {
      setValidationErrors(['Erro ao verificar disponibilidade. Tente novamente.'])
    } finally {
      setIsValidating(false)
    }
  }

  function getEffectivePrice(item: CartItem): number {
    if (
      item.wholesalePrice != null &&
      item.wholesaleMinQty != null &&
      item.quantity >= item.wholesaleMinQty
    ) {
      return item.wholesalePrice
    }
    return item.price
  }

  async function handleSendWhatsapp() {
    if (!settings.whatsappNumber) {
      alert('Número do WhatsApp não configurado. Entre em contato pela loja.')
      return
    }

    setIsSendingOrder(true)
    try {
      // Salva o pedido no Firestore antes de abrir o WhatsApp
      const orderId = await createOrder(items)

      const message = generateWhatsappMessage(
        items.map((i) => ({
          name: i.name,
          category: i.category,
          color: i.color,
          size: i.size,
          price: getEffectivePrice(i),
          quantity: i.quantity,
        })),
        orderId
      )

      openWhatsapp(settings.whatsappNumber, message)
      clearCart()
      handleClose()
    } catch (err) {
      console.error('Erro ao registrar pedido:', err)
      alert('Erro ao registrar o pedido. Tente novamente.')
    } finally {
      setIsSendingOrder(false)
    }
  }

  function handleClose() {
    setStep('cart')
    setValidationErrors([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="cart-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Carrinho de compras"
      >
        {/* Header */}
        <div className="cart-drawer__header">
          {step === 'review' ? (
            <>
              <button
                onClick={() => setStep('cart')}
                className="cart-drawer__back"
                aria-label="Voltar ao carrinho"
                id="btn-cart-back"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
                Voltar
              </button>
              <h2 className="cart-drawer__title">Revisar pedido</h2>
            </>
          ) : (
            <>
              <h2 className="cart-drawer__title">
                Carrinho
                {totalItems > 0 && (
                  <span className="cart-drawer__count">{totalItems}</span>
                )}
              </h2>
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="cart-drawer__clear"
                  aria-label="Limpar carrinho"
                  id="btn-cart-clear"
                >
                  Limpar
                </button>
              )}
            </>
          )}
          <button
            onClick={handleClose}
            className="cart-drawer__close"
            aria-label="Fechar carrinho"
            id="btn-cart-close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="cart-drawer__body">
          {items.length === 0 ? (
            <div className="cart-drawer__empty">
              <div className="cart-drawer__empty-icon" aria-hidden="true">🛍️</div>
              <h3>Seu carrinho está vazio</h3>
              <p>Explore nosso catálogo e adicione produtos que você gostou.</p>
              <button
                onClick={handleClose}
                className="btn btn-primary"
                id="btn-cart-explore"
              >
                Ver catálogo
              </button>
            </div>
          ) : step === 'cart' ? (
            <>
              {/* Erros de validação */}
              {validationErrors.length > 0 && (
                <div className="alert alert-warning cart-drawer__validation-alert">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div>
                    <strong>Atenção! Itens atualizados:</strong>
                    <ul className="cart-drawer__error-list">
                      {validationErrors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Lista de itens */}
              <ul className="cart-drawer__items" aria-label="Itens no carrinho">
                {items.map((item) => (
                  <CartItemRow
                    key={item.productId}
                    item={item}
                    onRemove={() => removeItem(item.productId)}
                    onUpdateQty={(qty) => updateQuantity(item.productId, qty)}
                  />
                ))}
              </ul>
            </>
          ) : (
            /* Tela de revisão */
            <div className="cart-drawer__review">
              <div className="alert alert-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>Revise seu pedido abaixo. Ao clicar no botão, o WhatsApp abrirá com a mensagem preenchida. <strong>Você precisará pressionar "Enviar" no WhatsApp.</strong></p>
              </div>

              <div className="cart-drawer__review-items">
                {items.map((item) => {
                  const effPrice = getEffectivePrice(item)
                  const isWholesale = effPrice !== item.price
                  return (
                    <div key={item.productId} className="cart-drawer__review-item">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="cart-drawer__review-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <div className="cart-drawer__review-info">
                        <strong>{item.name}</strong>
                        <span>{item.color} · {item.size}</span>
                        <span>
                          {item.quantity}x {formatCurrency(effPrice)}
                          {isWholesale && (
                            <span className="cart-drawer__wholesale-badge">Atacado</span>
                          )}
                        </span>
                      </div>
                      <div className="cart-drawer__review-subtotal">
                        {formatCurrency(effPrice * item.quantity)}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="cart-drawer__review-notice">
                <p>⚠️ O envio da mensagem não confirma a compra. A disponibilidade, o pagamento e a entrega serão combinados diretamente com a loja.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__total">
              <span>Total estimado</span>
              <span className="cart-drawer__total-value">{formatCurrency(totalPrice)}</span>
            </div>

            {step === 'cart' ? (
              <button
                onClick={handleProceedToReview}
                disabled={isValidating}
                className="btn btn-primary btn-lg cart-drawer__checkout-btn"
                id="btn-cart-review"
              >
                {isValidating ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Verificando...
                  </>
                ) : (
                  <>
                    Revisar pedido
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSendWhatsapp}
                disabled={isSendingOrder}
                className="btn btn-whatsapp cart-drawer__checkout-btn"
                id="btn-send-whatsapp"
              >
                {isSendingOrder ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} />
                    Registrando...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Enviar pedido pelo WhatsApp
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  )
}

// ── Item individual do carrinho ──
interface CartItemRowProps {
  item: CartItem
  onRemove: () => void
  onUpdateQty: (qty: number) => void
}

function CartItemRow({ item, onRemove, onUpdateQty }: CartItemRowProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <li className="cart-item">
      {/* Imagem */}
      {item.imageUrl && !imgError ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="cart-item__image"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="cart-item__image-placeholder" aria-hidden="true">📦</div>
      )}

      {/* Info */}
      <div className="cart-item__info">
        <div className="cart-item__name">{item.name}</div>
        <div className="cart-item__meta">
          {item.color} · {item.size}
        </div>
        <div className="cart-item__price">{formatCurrency(item.price)}/un</div>

        {/* Controles de quantidade */}
        <div className="cart-item__qty-controls">
          <button
            onClick={() => onUpdateQty(item.quantity - 1)}
            className="cart-item__qty-btn"
            aria-label="Diminuir quantidade"
            id={`btn-qty-minus-${item.productId}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <span className="cart-item__qty" aria-label={`Quantidade: ${item.quantity}`}>
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQty(item.quantity + 1)}
            className="cart-item__qty-btn"
            aria-label="Aumentar quantidade"
            id={`btn-qty-plus-${item.productId}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Subtotal e remover */}
      <div className="cart-item__right">
        <span className="cart-item__subtotal">
          {formatCurrency(item.price * item.quantity)}
        </span>
        <button
          onClick={onRemove}
          className="cart-item__remove"
          aria-label={`Remover ${item.name} do carrinho`}
          id={`btn-remove-${item.productId}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
        </button>
      </div>
    </li>
  )
}
