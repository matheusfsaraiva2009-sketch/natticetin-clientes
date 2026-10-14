import { useEffect, useState } from 'react'
import type { Product, ProductCategory } from '../types'
import {
  subscribeToActiveProducts,
  subscribeToProductsByCategory,
  subscribeToAllProducts,
} from '../services/products'

interface UseProductsResult {
  products: Product[]
  isLoading: boolean
  error: string | null
}

/**
 * Hook para produtos públicos do catálogo (todos ativos).
 */
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToActiveProducts(
      (newProducts) => {
        setProducts(newProducts)
        setIsLoading(false)
      },
      (err) => {
        setError('Erro ao carregar produtos. Tente novamente.')
        setIsLoading(false)
        console.error(err)
      }
    )
    return unsubscribe
  }, [])

  return { products, isLoading, error }
}

/**
 * Hook para produtos de uma categoria específica.
 */
export function useProductsByCategory(category: ProductCategory): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToProductsByCategory(
      category,
      (newProducts) => {
        setProducts(newProducts)
        setIsLoading(false)
      },
      (err) => {
        setError(`Erro ao carregar produtos. Tente novamente.`)
        setIsLoading(false)
        console.error(err)
      }
    )
    return unsubscribe
  }, [category])

  return { products, isLoading, error }
}

/**
 * Hook para TODOS os produtos (admin).
 */
export function useAllProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToAllProducts(
      (newProducts) => {
        setProducts(newProducts)
        setIsLoading(false)
      },
      (err) => {
        setError('Erro ao carregar produtos.')
        setIsLoading(false)
        console.error(err)
      }
    )
    return unsubscribe
  }, [])

  return { products, isLoading, error }
}
