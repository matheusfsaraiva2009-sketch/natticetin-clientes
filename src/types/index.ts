export type ProductCategory = 'toucas' | 'scrunchies'

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock'

/** Variante de tamanho com estoque e preço próprios */
export interface SizeVariant {
  size: string              // ex: "M", "G", "Único"
  price: number             // in centavos
  stock: number
  wholesalePrice?: number   // preço de atacado em centavos (opcional)
  wholesaleMinQty?: number  // quantidade mínima para aplicar atacado (opcional)
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  description: string
  color: string
  size: string             // legado / fallback quando não há variantes
  price: number             // legado / fallback
  wholesalePrice?: number   // preço de atacado em centavos (opcional, legado)
  wholesaleMinQty?: number  // quantidade mínima para atacado (opcional, legado)
  stock: number            // legado / soma total quando há variantes
  variants: SizeVariant[]  // [] = sem variantes de tamanho
  imageUrl: string
  imageUrls: string[]
  active: boolean
  status: ProductStatus
  featured: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductFormData {
  name: string
  category: ProductCategory
  description: string
  color: string
  size: string
  price: number             // in centavos
  wholesalePrice?: number   // preço de atacado em centavos (opcional)
  wholesaleMinQty?: number  // quantidade mínima para aplicar atacado (opcional)
  stock: number
  variants: SizeVariant[]
  imageUrl: string
  imageUrls: string[]
  active: boolean
  status: ProductStatus
  featured: boolean
}

export interface CartItem {
  productId: string
  name: string
  category: ProductCategory
  color: string
  size: string
  price: number             // preço unitário normal em centavos
  wholesalePrice?: number   // preço de atacado em centavos (opcional)
  wholesaleMinQty?: number  // quantidade mínima para atacado (opcional)
  imageUrl: string
  quantity: number
}

export interface StoreSettings {
  brandName: string
  logoUrl: string
  tagline: string
  description: string
  whatsappNumber: string // format: 55DDNUMERO
  instagramHandle: string
  instagramUrl: string
  footerText: string
  heroImageUrl: string
  heroTitle: string
  heroSubtitle: string
  primaryEmail: string
}

export interface AdminUser {
  uid: string
  email: string
  isAdmin: boolean
}

export type OrderStatus = 'pending' | 'confirmed' | 'rejected'

export interface Order {
  id: string
  items: CartItem[]
  totalPrice: number       // em centavos
  status: OrderStatus
  customerName: string
  customerPhone: string
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date
  rejectedAt?: Date
  notes?: string
}

