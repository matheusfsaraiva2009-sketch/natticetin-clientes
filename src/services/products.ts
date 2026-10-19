import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Product, ProductCategory, ProductFormData, SizeVariant } from '../types'

const PRODUCTS_COLLECTION = 'products'

/**
 * Converte documento Firestore para objeto Product tipado.
 */
function docToProduct(id: string, data: Record<string, unknown>): Product {
  return {
    id,
    name: (data.name as string) || '',
    category: (data.category as ProductCategory) || 'toucas',
    description: (data.description as string) || '',
    color: (data.color as string) || '',
    size: (data.size as string) || '',
    price: (data.price as number) || 0,
    stock: (data.stock as number) || 0,
    variants: (data.variants as SizeVariant[]) || [],
    imageUrl: (data.imageUrl as string) || '',
    imageUrls: (data.imageUrls as string[]) || [],
    active: (data.active as boolean) ?? true,
    status: (data.status as Product['status']) || 'active',
    featured: (data.featured as boolean) ?? false,
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(),
    updatedAt: (data.updatedAt as { toDate?: () => Date })?.toDate?.() ?? new Date(),
  }
}

// ──────────────────────────────────────────────
// LEITURA PÚBLICA (catálogo)
// ──────────────────────────────────────────────

/**
 * Observa produtos ativos em tempo real para o catálogo público.
 * Apenas produtos com active=true são retornados.
 */
export function subscribeToActiveProducts(
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('active', '==', true)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs
        .map((doc) => docToProduct(doc.id, doc.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      callback(products)
    },
    (error) => {
      console.error('Erro ao observar produtos:', error)
      onError?.(error)
    }
  )
}

/**
 * Observa produtos de uma categoria específica em tempo real.
 */
export function subscribeToProductsByCategory(
  category: ProductCategory,
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    where('active', '==', true),
    where('category', '==', category)
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs
        .map((doc) => docToProduct(doc.id, doc.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      callback(products)
    },
    (error) => {
      console.error(`Erro ao observar produtos da categoria ${category}:`, error)
      onError?.(error)
    }
  )
}

/**
 * Busca produto por ID para validação do carrinho.
 * Retorna null se não encontrado ou inativo.
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    const data = docSnap.data() as Record<string, unknown>
    if (!data.active) return null
    return docToProduct(docSnap.id, data)
  } catch (error) {
    console.error('Erro ao buscar produto:', error)
    return null
  }
}

/**
 * Valida múltiplos produtos do carrinho contra dados atuais do Firestore.
 * Retorna array com status de validação de cada item.
 */
export async function validateCartItems(
  items: Array<{ productId: string; price: number; quantity: number }>
): Promise<
  Array<{
    productId: string
    valid: boolean
    reason?: string
    currentProduct?: Product
  }>
> {
  const results = await Promise.all(
    items.map(async (item) => {
      const product = await getProductById(item.productId)

      if (!product) {
        return {
          productId: item.productId,
          valid: false,
          reason: 'Produto não encontrado ou indisponível',
        }
      }

      if (!product.active || product.status === 'inactive') {
        return {
          productId: item.productId,
          valid: false,
          reason: 'Produto foi desativado',
          currentProduct: product,
        }
      }

      if (product.stock === 0 || product.status === 'out_of_stock') {
        return {
          productId: item.productId,
          valid: false,
          reason: 'Produto esgotado',
          currentProduct: product,
        }
      }

      if (item.quantity > product.stock) {
        return {
          productId: item.productId,
          valid: false,
          reason: `Estoque insuficiente. Disponível: ${product.stock}`,
          currentProduct: product,
        }
      }

      if (item.price !== product.price) {
        return {
          productId: item.productId,
          valid: false,
          reason: `Preço atualizado para ${product.price}`,
          currentProduct: product,
        }
      }

      return {
        productId: item.productId,
        valid: true,
        currentProduct: product,
      }
    })
  )

  return results
}

// ──────────────────────────────────────────────
// ADMINISTRAÇÃO (requer autenticação)
// ──────────────────────────────────────────────

/**
 * Observa TODOS os produtos para o painel admin (incluindo inativos).
 */
export function subscribeToAllProducts(
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const products = snapshot.docs.map((doc) =>
        docToProduct(doc.id, doc.data() as Record<string, unknown>)
      )
      callback(products)
    },
    (error) => {
      console.error('Erro ao observar todos os produtos:', error)
      onError?.(error)
    }
  )
}

/**
 * Cria novo produto no Firestore.
 * Retorna o ID do documento criado.
 */
export async function createProduct(data: ProductFormData): Promise<string> {
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

/**
 * Atualiza produto existente.
 */
export async function updateProduct(
  id: string,
  data: Partial<ProductFormData>
): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Exclui produto do Firestore.
 * A exclusão das imagens deve ser feita separadamente via deleteProductImages.
 */
export async function deleteProduct(id: string): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id)
  await deleteDoc(docRef)
}

/**
 * Busca todos os produtos uma vez (para admin sem listener).
 */
export async function getAllProductsOnce(): Promise<Product[]> {
  const q = query(
    collection(db, PRODUCTS_COLLECTION),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) =>
    docToProduct(doc.id, doc.data() as Record<string, unknown>)
  )
}
