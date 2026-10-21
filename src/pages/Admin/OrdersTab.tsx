import { useState, useEffect } from 'react'
import type { Order } from '../../types'
import { subscribeToOrders, confirmOrder, rejectOrder } from '../../services/orders'
import { formatCurrency } from '../../utils'
import './OrdersTab.css'

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'rejected'

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<Order | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsub = subscribeToOrders(
      (data) => {
        setOrders(data)
        setIsLoading(false)
      },
      () => {
        setError('Erro ao carregar pedidos.')
        setIsLoading(false)
      }
    )
    return () => unsub()
  }, [])

  const filtered = orders.filter((o) => filter === 'all' || o.status === filter)
  const pendingCount = orders.filter((o) => o.status === 'pending').length

  async function handleConfirm(order: Order) {
    if (!window.confirm(`Confirmar pedido #${order.id.slice(-6).toUpperCase()}?\n\nIsso irá descontar o estoque automaticamente.`)) return
    setProcessingId(order.id)
    try {
      await confirmOrder(order.id)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao confirmar pedido.'
      alert(`Erro: ${msg}`)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleRejectConfirm() {
    if (!rejectModal) return
    setProcessingId(rejectModal.id)
    try {
      await rejectOrder(rejectModal.id, rejectNotes)
      setRejectModal(null)
      setRejectNotes('')
    } catch {
      alert('Erro ao rejeitar pedido.')
    } finally {
      setProcessingId(null)
    }
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  function statusLabel(status: Order['status']) {
    if (status === 'pending') return { label: 'Pendente', cls: 'order-badge--pending' }
    if (status === 'confirmed') return { label: 'Confirmado', cls: 'order-badge--confirmed' }
    return { label: 'Rejeitado', cls: 'order-badge--rejected' }
  }

  if (isLoading) return <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
  if (error) return <div className="alert alert-error">{error}</div>

  return (
    <div className="orders-tab animate-fade-in">
      {/* Filtros */}
      <div className="orders-tab__filters">
        {(['pending', 'confirmed', 'rejected', 'all'] as FilterStatus[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`orders-filter-btn ${filter === f ? 'is-active' : ''}`}
            id={`btn-orders-filter-${f}`}
          >
            {f === 'pending' && `Pendentes${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
            {f === 'confirmed' && 'Confirmados'}
            {f === 'rejected' && 'Rejeitados'}
            {f === 'all' && 'Todos'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty">
          <div style={{ fontSize: '2.5rem' }}>📋</div>
          <h3>Nenhum pedido {filter !== 'all' ? `${filter === 'pending' ? 'pendente' : filter === 'confirmed' ? 'confirmado' : 'rejeitado'}` : ''}</h3>
          <p>Os pedidos enviados pelo WhatsApp aparecerão aqui.</p>
        </div>
      ) : (
        <div className="orders-list">
          {filtered.map((order) => {
            const { label, cls } = statusLabel(order.status)
            const isExpanded = expandedId === order.id
            const shortId = order.id.slice(-6).toUpperCase()

            return (
              <div key={order.id} className={`order-card order-card--${order.status}`}>
                {/* Header do card */}
                <div
                  className="order-card__header"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => e.key === 'Enter' && setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="order-card__header-left">
                    <span className="order-card__id">#{shortId}</span>
                    <span className={`order-badge ${cls}`}>{label}</span>
                    {order.status === 'pending' && (
                      <span className="order-card__pulse" aria-hidden="true" />
                    )}
                  </div>
                  <div className="order-card__header-right">
                    <span className="order-card__total">{formatCurrency(order.totalPrice)}</span>
                    <span className="order-card__date">{formatDate(order.createdAt)}</span>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                      className={`order-card__chevron ${isExpanded ? 'is-open' : ''}`}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Itens (expandível) */}
                {isExpanded && (
                  <div className="order-card__body">
                    <div className="order-card__items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-card__item">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="order-card__item-img"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          )}
                          <div className="order-card__item-info">
                            <strong>{item.name}</strong>
                            <span>{item.color}{item.size ? ` · ${item.size}` : ''}</span>
                            <span>{item.quantity}x {formatCurrency(item.price)}</span>
                          </div>
                          <div className="order-card__item-subtotal">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <p className="order-card__notes">
                        <strong>Obs:</strong> {order.notes}
                      </p>
                    )}

                    {order.confirmedAt && (
                      <p className="order-card__timestamp order-card__timestamp--confirmed">
                        ✓ Confirmado em {formatDate(order.confirmedAt)}
                      </p>
                    )}
                    {order.rejectedAt && (
                      <p className="order-card__timestamp order-card__timestamp--rejected">
                        ✗ Rejeitado em {formatDate(order.rejectedAt)}
                      </p>
                    )}

                    {/* Ações — apenas para pedidos pendentes */}
                    {order.status === 'pending' && (
                      <div className="order-card__actions">
                        <button
                          onClick={() => handleConfirm(order)}
                          disabled={processingId === order.id}
                          className="btn btn-success"
                          id={`btn-confirm-order-${order.id}`}
                        >
                          {processingId === order.id ? (
                            <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'white' }} /> Confirmando...</>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Confirmar e descontar estoque
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => { setRejectModal(order); setRejectNotes('') }}
                          disabled={processingId === order.id}
                          className="btn btn-danger"
                          id={`btn-reject-order-${order.id}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de rejeição */}
      {rejectModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
          <div className="modal">
            <div className="modal-header">
              <h2 id="reject-modal-title" className="modal-title">Rejeitar pedido</h2>
              <button
                onClick={() => setRejectModal(null)}
                className="cart-drawer__close"
                aria-label="Fechar"
                id="btn-reject-modal-close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Rejeitar pedido <strong>#{rejectModal.id.slice(-6).toUpperCase()}</strong>?</p>
              <p className="form-hint" style={{ marginTop: 'var(--space-2)' }}>
                O estoque não será alterado.
              </p>
              <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="form-label" htmlFor="reject-notes">Motivo (opcional)</label>
                <textarea
                  id="reject-notes"
                  className="form-input"
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Ex: cliente cancelou, produto esgotado..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setRejectModal(null)} className="btn btn-ghost" id="btn-reject-cancel">
                Cancelar
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={processingId === rejectModal.id}
                className="btn btn-danger"
                id="btn-reject-confirm"
              >
                {processingId === rejectModal.id ? 'Rejeitando...' : 'Rejeitar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
