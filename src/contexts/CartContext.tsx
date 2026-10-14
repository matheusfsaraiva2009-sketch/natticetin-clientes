import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { CartItem } from '../types'

const CART_STORAGE_KEY = 'val_acessorios_cart'

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  totalPrice: number // in centavos
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  updateItemsFromValidation: (updatedItems: CartItem[]) => void
}

const CartContext = createContext<CartContextValue>({
  items: [],
  totalItems: 0,
  totalPrice: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  updateItemsFromValidation: () => {},
})

function loadCartFromStorage(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as CartItem[]
  } catch {
    return []
  }
}

function saveCartToStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage pode não estar disponível em modo privado
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCartFromStorage)

  // Persiste no localStorage sempre que o carrinho mudar
  useEffect(() => {
    saveCartToStorage(items)
  }, [items])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === newItem.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === newItem.productId
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        )
      }
      return [...prev, newItem]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.productId !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  // Atualiza itens após validação do Firestore (preços/estoque mudaram)
  const updateItemsFromValidation = useCallback((updatedItems: CartItem[]) => {
    setItems(updatedItems)
  }, [])

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        updateItemsFromValidation,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
