import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useAllProducts } from '../../hooks/useProducts'
import { signOutUser } from '../../services/auth'
import { deleteProduct } from '../../services/products'
import { subscribeToOrders } from '../../services/orders'
import { formatCurrency } from '../../utils'
import type { Product, Order } from '../../types'
import { ProductForm } from './ProductForm'
import { SettingsForm } from './SettingsForm'
import { OrdersTab } from './OrdersTab'
import './AdminPage.css'

type AdminTab = 'dashboard' | 'products' | 'orders' | 'add' | 'settings'

export function AdminPage() {
  const { user } = useAuth()
  const { products, isLoading, error } = useAllProducts()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)

  // Observa contagem de pedidos pendentes
  useEffect(() => {
    const unsub = subscribeToOrders((orders: Order[]) => {
      setPendingOrdersCount(orders.filter((o) => o.status === 'pending').length)
    })
    return () => unsub()
  }, [])

  // Stats
  const totalProducts = products.length
  const activeProducts = products.filter((p) => p.active && p.stock > 0 && p.status !== 'inactive').length
  const outOfStock = products.filter((p) => p.status !== 'inactive' && (p.stock === 0 || p.status === 'out_of_stock')).length
  const toucasCount = products.filter((p) => p.category === 'toucas').length
  const scrunchiesCount = products.filter((p) => p.category === 'scrunchies').length

  async function handleSignOut() {
    await signOutUser()
    navigate('/login')
  }

  function showSuccess(msg: string) {
    setSuccessMessage(msg)
    setTimeout(() => setSuccessMessage(''), 4000)
  }

  function handleEditProduct(product: Product) {
    setEditingProduct(product)
    setActiveTab('add')
  }

  function handleProductSaved() {
    setEditingProduct(null)
    setActiveTab('products')
    showSuccess(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!')
  }

  function handleCancelForm() {
    setEditingProduct(null)
    setActiveTab('products')
  }

  async function handleDeleteConfirmed() {
    if (!deleteConfirm) return
    setDeletingId(deleteConfirm.id)

    try {
      await deleteProduct(deleteConfirm.id)
      showSuccess('Produto excluído.')
    } catch {
      alert('Erro ao excluir o produto. Tente novamente.')
    } finally {
      setDeletingId(null)
      setDeleteConfirm(null)
    }
  }

  const statusBadge = (p: Product) => {
    if (p.status === 'inactive') return <span className="badge badge-inactive">Inativo</span>
    if (p.status === 'out_of_stock' || p.stock === 0) return <span className="badge badge-outofstock">Esgotado</span>
    if (!p.active) return <span className="badge badge-inactive">Inativo</span>
    if (p.featured) return <span className="badge badge-featured">Destaque</span>
    return <span className="badge badge-active">Ativo</span>
  }

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="admin-sidebar" aria-label="Menu administrativo">
        <div className="admin-sidebar__header">
          <div className="admin-sidebar__logo">V</div>
          <div>
            <div className="admin-sidebar__brand">Val Acessórios</div>
            <div className="admin-sidebar__role">Administrador</div>
          </div>
        </div>

        <nav className="admin-sidebar__nav">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`admin-nav-btn ${activeTab === 'dashboard' ? 'is-active' : ''}`}
            id="btn-admin-dashboard"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </button>

          <button
            onClick={() => { setEditingProduct(null); setActiveTab('products') }}
            className={`admin-nav-btn ${activeTab === 'products' ? 'is-active' : ''}`}
            id="btn-admin-products"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
            </svg>
            Produtos
          </button>

          <button
            onClick={() => { setEditingProduct(null); setActiveTab('add') }}
            className={`admin-nav-btn ${activeTab === 'add' && !editingProduct ? 'is-active' : ''}`}
            id="btn-admin-add"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Novo produto
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`admin-nav-btn ${activeTab === 'orders' ? 'is-active' : ''}`}
            id="btn-admin-orders"
            style={{ position: 'relative' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
            </svg>
            Pedidos
            {pendingOrdersCount > 0 && (
              <span className="admin-nav-badge">{pendingOrdersCount}</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`admin-nav-btn ${activeTab === 'settings' ? 'is-active' : ''}`}
            id="btn-admin-settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            Configurações
          </button>
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar" aria-hidden="true">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__email">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="admin-sidebar__signout"
            title="Sair"
            id="btn-admin-signout"
            aria-label="Sair da conta"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <h1 className="admin-topbar__title">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'products' && 'Produtos'}
            {activeTab === 'orders' && 'Pedidos'}
            {activeTab === 'add' && (editingProduct ? 'Editar produto' : 'Novo produto')}
            {activeTab === 'settings' && 'Configurações da marca'}
          </h1>
          {successMessage && (
            <div className="alert alert-success admin-topbar__success" role="status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              {successMessage}
            </div>
          )}
          <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" id="btn-admin-view-site">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Ver site
          </a>
        </div>

        <div className="admin-content">
          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="admin-dashboard animate-fade-in">
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-card__value">{totalProducts}</div>
                  <div className="admin-stat-card__label">Total de produtos</div>
                </div>
                <div className="admin-stat-card admin-stat-card--success">
                  <div className="admin-stat-card__value">{activeProducts}</div>
                  <div className="admin-stat-card__label">Disponíveis</div>
                </div>
                <div className="admin-stat-card admin-stat-card--error">
                  <div className="admin-stat-card__value">{outOfStock}</div>
                  <div className="admin-stat-card__label">Esgotados</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-card__value">{toucasCount}</div>
                  <div className="admin-stat-card__label">Toucas</div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-card__value">{scrunchiesCount}</div>
                  <div className="admin-stat-card__label">Scrunchies</div>
                </div>
              </div>

              <div className="admin-shortcuts">
                <h2 className="admin-section-title">Ações rápidas</h2>
                <div className="admin-shortcuts__grid">
                  <button onClick={() => setActiveTab('add')} className="admin-shortcut-btn" id="btn-shortcut-add">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    Cadastrar produto
                  </button>
                  <button onClick={() => setActiveTab('settings')} className="admin-shortcut-btn" id="btn-shortcut-settings">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                    Configurações da marca
                  </button>
                </div>
              </div>

              {/* Preview últimos produtos */}
              {products.length > 0 && (
                <div className="admin-recent">
                  <h2 className="admin-section-title">Últimos produtos</h2>
                  <div className="admin-product-table">
                    {products.slice(0, 5).map((p) => (
                      <div key={p.id} className="admin-product-row">
                        <div className="admin-product-row__img-wrap">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="admin-product-row__img" />
                          ) : (
                            <div className="admin-product-row__img-placeholder">📦</div>
                          )}
                        </div>
                        <div className="admin-product-row__info">
                          <div className="admin-product-row__name">{p.name}</div>
                          <div className="admin-product-row__meta">{p.color} · {p.size}</div>
                        </div>
                        {statusBadge(p)}
                        <div className="admin-product-row__price">{formatCurrency(p.price)}</div>
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="btn btn-ghost btn-sm"
                          id={`btn-edit-${p.id}`}
                        >
                          Editar
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab('products')}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 'var(--space-4)' }}
                    id="btn-view-all-products"
                  >
                    Ver todos os produtos
                  </button>
                </div>
              )}
            </div>
          )}

          {/* PRODUCTS LIST */}
          {activeTab === 'products' && (
            <div className="animate-fade-in">
              <div className="admin-products-header">
                <p className="admin-products-count">
                  {totalProducts} produto{totalProducts !== 1 ? 's' : ''} cadastrado{totalProducts !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => { setEditingProduct(null); setActiveTab('add') }}
                  className="btn btn-primary btn-sm"
                  id="btn-products-add"
                >
                  + Novo produto
                </button>
              </div>

              {isLoading ? (
                <div className="loading-overlay"><div className="spinner spinner-lg" /></div>
              ) : error ? (
                <div className="alert alert-error">{error}</div>
              ) : products.length === 0 ? (
                <div className="admin-empty">
                  <div style={{ fontSize: '3rem' }}>📦</div>
                  <h3>Nenhum produto cadastrado</h3>
                  <p>Comece cadastrando o primeiro produto da sua loja.</p>
                  <button onClick={() => setActiveTab('add')} className="btn btn-primary" id="btn-empty-add">
                    Cadastrar produto
                  </button>
                </div>
              ) : (
                <div className="admin-product-table">
                  {products.map((p) => (
                    <div key={p.id} className="admin-product-row">
                      <div className="admin-product-row__img-wrap">
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="admin-product-row__img" />
                        ) : (
                          <div className="admin-product-row__img-placeholder" aria-hidden="true">📦</div>
                        )}
                      </div>
                      <div className="admin-product-row__info">
                        <div className="admin-product-row__name">{p.name}</div>
                        <div className="admin-product-row__meta">
                          {p.category === 'toucas' ? 'Touca' : 'Scrunchie'} · {p.color} · {p.size}
                        </div>
                        <div className="admin-product-row__stock">
                          Estoque: {p.stock}
                        </div>
                      </div>
                      {statusBadge(p)}
                      <div className="admin-product-row__price">{formatCurrency(p.price)}</div>
                      <div className="admin-product-row__actions">
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="btn btn-ghost btn-sm"
                          id={`btn-edit-list-${p.id}`}
                          aria-label={`Editar ${p.name}`}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p)}
                          className="btn btn-sm"
                          style={{ color: 'var(--color-error)', border: '1px solid var(--border-color)' }}
                          id={`btn-delete-${p.id}`}
                          aria-label={`Excluir ${p.name}`}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ORDERS */}
          {activeTab === 'orders' && (
            <OrdersTab />
          )}

          {/* PRODUCT FORM */}
          {activeTab === 'add' && (
            <ProductForm
              product={editingProduct}
              onSaved={handleProductSaved}
              onCancel={handleCancelForm}
            />
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsForm onSaved={() => showSuccess('Configurações salvas com sucesso!')} />
          )}
        </div>
      </main>

      {/* Modal de confirmação de exclusão */}
      {deleteConfirm && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="modal">
            <div className="modal-header">
              <h2 id="delete-modal-title" className="modal-title">Excluir produto</h2>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="cart-drawer__close"
                aria-label="Fechar"
                id="btn-delete-modal-close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir <strong>"{deleteConfirm.name}"</strong>?</p>
              <p className="form-hint" style={{ marginTop: 'var(--space-2)' }}>
                Esta ação é irreversível. As imagens também serão removidas.
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn btn-ghost"
                disabled={!!deletingId}
                id="btn-delete-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="btn btn-danger"
                disabled={!!deletingId}
                id="btn-delete-confirm"
              >
                {deletingId ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: 'white' }} />
                    Excluindo...
                  </>
                ) : (
                  'Excluir produto'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
