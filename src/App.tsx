import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { Header } from './components/Header/Header'
import { Footer } from './components/Footer/Footer'
import { CartDrawer } from './components/Cart/CartDrawer'
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute'
import { HomePage } from './pages/Home/HomePage'
import { LoginPage } from './pages/Login/LoginPage'
import { AdminPage } from './pages/Admin/AdminPage'
import { NotFoundPage } from './pages/NotFound/NotFoundPage'
import './styles/globals.css'

// Layout público (com header, footer e carrinho)
function PublicLayout() {
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onCartOpen={() => setIsCartOpen(true)} />
      <div style={{ paddingTop: 'var(--header-height)', flex: 1 }}>
        <HomePage />
      </div>
      <Footer />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <Routes>
              {/* Catálogo público */}
              <Route path="/" element={<PublicLayout />} />

              {/* Login da proprietária */}
              <Route path="/login" element={<LoginPage />} />

              {/* Painel administrativo (protegido) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />

              {/* Página não encontrada */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
