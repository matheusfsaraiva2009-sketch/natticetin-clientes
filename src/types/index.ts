export type ProductCategory = 'toucas' | 'scrunchies'

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock'

/** Variante de tamanho com estoque e preço próprios */
export interface SizeVariant {
  size: string    // ex: "M", "G", "Único"
  price: number   // in centavos
  stock: number
}

export interface Product {
  id: string
  name: string
  category: ProductCategory
  description: string
  color: string
  size: string        // legado / fallback quando não há variantes
  price: number       // legado / fallback
  stock: number       // legado / soma total quando há variantes
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
  price: number // in centavos
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
  price: number // in centavos
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
