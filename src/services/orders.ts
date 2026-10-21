import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { CartItem, Order, OrderStatus } from '../types'

const ORDERS_COLLECTION = 'orders'
const PRODUCTS_COLLECTION = 'products'

// ──────────────────────────────────────────────
// CLIENTE: criar pedido
// ──────────────────────────────────────────────

/**
 * Salva o pedido no Firestore com status "pending".
 * Retorna o ID do pedido criado.
 */
export async function createOrder(
  items: CartItem[],
  customerName?: string,
  customerPhone?: string
): Promise<string> {
  const totalPrice = items.reduce((sum, item) => {
    const price =
      item.wholesalePrice != null &&
      item.wholesaleMinQty != null &&
      item.quantity >= item.wholesaleMinQty
        ? item.wholesalePrice
        : item.price
    return sum + price * item.quantity
  }, 0)

  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    items: items.map((i) => ({
      productId: i.productId,
      name: i.name,
      category: i.category,
      color: i.color,
      size: i.size,
      price: i.price,
      ...(i.wholesalePrice != null && { wholesalePrice: i.wholesalePrice }),
      ...(i.wholesaleMinQty != null && { wholesaleMinQty: i.wholesaleMinQty }),
      imageUrl: i.imageUrl,
      quantity: i.quantity,
    })),
    totalPrice,
    status: 'pending' as OrderStatus,
    customerName: customerName ?? '',
    customerPhone: customerPhone ?? '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return docRef.id
}

// ──────────────────────────────────────────────
// ADMIN: listar pedidos em tempo real
// ──────────────────────────────────────────────

/**
 * Observa todos os pedidos em tempo real (mais recentes primeiro).
 */
export function subscribeToOrders(
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>
        return {
          id: docSnap.id,
          items: (d.items as CartItem[]) ?? [],
          totalPrice: (d.totalPrice as number) ?? 0,
          status: (d.status as OrderStatus) ?? 'pending',
          customerName: (d.customerName as string) ?? '',
          customerPhone: (d.customerPhone as string) ?? '',
          createdAt: (d.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(),
          updatedAt: (d.updatedAt as { toDate?: () => Date })?.toDate?.() ?? new Date(),
          confirmedAt: (d.confirmedAt as { toDate?: () => Date })?.toDate?.() ?? undefined,
          rejectedAt: (d.rejectedAt as { toDate?: () => Date })?.toDate?.() ?? undefined,
          notes: (d.notes as string) ?? '',
        }
      })
      callback(orders)
    },
    (error) => {
      console.error('Erro ao observar pedidos:', error)
      onError?.(error)
    }
  )
}

// ──────────────────────────────────────────────
// ADMIN: confirmar pedido → desconta estoque
// ──────────────────────────────────────────────

/**
 * Confirma o pedido e desconta o estoque de cada item via transação atômica.
 * Se o estoque for insuficiente para qualquer item, a transação falha.
 */
export async function confirmOrder(orderId: string): Promise<void> {
  await runTransaction(db, async (transaction) => {
    // 1. Lê o pedido
    const orderRef = doc(db, ORDERS_COLLECTION, orderId)
    const orderSnap = await transaction.get(orderRef)
    if (!orderSnap.exists()) throw new Error('Pedido não encontrado.')

    const order = orderSnap.data() as { status: string; items: CartItem[] }
    if (order.status !== 'pending') {
      throw new Error('Pedido já foi processado.')
    }

    // 2. Para cada item, lê o produto e valida o estoque
    const productRefs = order.items.map((item) => {
      // productId tem formato "productDocId__size" — extrai o doc ID
      const [productDocId] = item.productId.split('__')
      return { ref: doc(db, PRODUCTS_COLLECTION, productDocId), item }
    })

    const productSnaps = await Promise.all(
      productRefs.map(({ ref }) => transaction.get(ref))
    )

    // 3. Valida estoque e monta updates
    const updates: Array<{
      ref: ReturnType<typeof doc>
      newStock: number
      newVariants?: unknown[]
    }> = []

    for (let i = 0; i < productRefs.length; i++) {
      const { item } = productRefs[i]
      const snap = productSnaps[i]
      if (!snap.exists()) throw new Error(`Produto "${item.name}" não encontrado.`)

      const data = snap.data() as Record<string, unknown>
      const size = item.size
      const rawVariants = (data.variants as Array<Record<string, unknown>>) ?? []

      if (rawVariants.length > 0) {
        // Produto com variantes — desconta na variante correta
        const variantIndex = rawVariants.findIndex((v) => v.size === size)
        if (variantIndex === -1) throw new Error(`Tamanho "${size}" não encontrado em "${item.name}".`)

        const variantStock = (rawVariants[variantIndex].stock as number) ?? 0
        if (variantStock < item.quantity) {
          throw new Error(
            `Estoque insuficiente para "${item.name}" (${size}). Disponível: ${variantStock}`
          )
        }

        const newVariants = rawVariants.map((v, idx) =>
          idx === variantIndex
            ? { ...v, stock: variantStock - item.quantity }
            : v
        )

        // Recalcula stock total
        const newTotalStock = newVariants.reduce(
          (s, v) => s + ((v.stock as number) ?? 0),
          0
        )

        updates.push({
          ref: productRefs[i].ref,
          newStock: newTotalStock,
          newVariants,
        })
      } else {
        // Produto sem variantes
        const stock = (data.stock as number) ?? 0
        if (stock < item.quantity) {
          throw new Error(
            `Estoque insuficiente para "${item.name}". Disponível: ${stock}`
          )
        }
        updates.push({
          ref: productRefs[i].ref,
          newStock: stock - item.quantity,
        })
      }
    }

    // 4. Aplica os updates de estoque
    for (const u of updates) {
      const productUpdate: Record<string, unknown> = {
        stock: u.newStock,
        updatedAt: serverTimestamp(),
      }
      if (u.newVariants) productUpdate.variants = u.newVariants
      if (u.newStock === 0) productUpdate.status = 'out_of_stock'

      transaction.update(u.ref, productUpdate)
    }

    // 5. Marca o pedido como confirmado
    transaction.update(orderRef, {
      status: 'confirmed',
      confirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })
}

// ──────────────────────────────────────────────
// ADMIN: rejeitar pedido
// ──────────────────────────────────────────────

/**
 * Rejeita o pedido sem alterar o estoque.
 */
export async function rejectOrder(orderId: string, notes?: string): Promise<void> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId)
  const snap = await getDoc(orderRef)
  if (!snap.exists()) throw new Error('Pedido não encontrado.')

  await updateDoc(orderRef, {
    status: 'rejected',
    rejectedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    // Grava sempre (inclusive string vazia) para permitir limpar notas antigas
    notes: notes ?? '',
  })
}
