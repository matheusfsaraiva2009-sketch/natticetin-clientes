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
  removeItem: (productId: string, size?: string) => void
  updateQuantity: (productId: string, quantity: number, size?: string) => void
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
  const totalPrice = items.reduce((sum, item) => {
    // Aplica preço de atacado quando a quantidade mínima for atingida
    const effectivePrice =
      item.wholesalePrice != null &&
      item.wholesaleMinQty != null &&
      item.quantity >= item.wholesaleMinQty
        ? item.wholesalePrice
        : item.price
    return sum + effectivePrice * item.quantity
  }, 0)

  // Chave única para identificar um item: combina productId + size (para variantes)
  function itemKey(productId: string, size: string) {
    return `${productId}__${size}`
  }

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const key = itemKey(newItem.productId, newItem.size)
      const existing = prev.find((i) => itemKey(i.productId, i.size) === key)
      if (existing) {
        return prev.map((i) =>
          itemKey(i.productId, i.size) === key
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        )
      }
      return [...prev, newItem]
    })
  }, [])

  const removeItem = useCallback((productId: string, size?: string) => {
    setItems((prev) =>
      prev.filter((i) => {
        if (size !== undefined) {
          return itemKey(i.productId, i.size) !== itemKey(productId, size)
        }
        // Fallback: remove todos os itens com esse productId (compatibilidade)
        return i.productId !== productId
      })
    )
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number, size?: string) => {
    if (quantity <= 0) {
      setItems((prev) =>
        prev.filter((i) => {
          if (size !== undefined) {
            return itemKey(i.productId, i.size) !== itemKey(productId, size)
          }
          return i.productId !== productId
        })
      )
      return
    }
    setItems((prev) =>
      prev.map((i) => {
        const matches =
          size !== undefined
            ? itemKey(i.productId, i.size) === itemKey(productId, size)
            : i.productId === productId
        return matches ? { ...i, quantity } : i
      })
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
