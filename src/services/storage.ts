import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type StorageReference,
} from 'firebase/storage'
import { storage } from './firebase'

// Tamanho máximo de arquivo: 5 MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

// Tipos de imagem permitidos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface UploadProgress {
  progress: number // 0-100
  downloadUrl?: string
  error?: string
}

/**
 * Valida o arquivo de imagem antes do upload.
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Tipo de arquivo não permitido. Use: JPEG, PNG, WEBP ou GIF.`
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Arquivo muito grande. Máximo: 5 MB. Seu arquivo: ${(file.size / 1024 / 1024).toFixed(1)} MB`
  }
  return null
}

/**
 * Faz upload de imagem de produto para o Firebase Storage.
 * Retorna a URL de download após o upload.
 *
 * @param productId - ID do produto
 * @param file - Arquivo de imagem
 * @param onProgress - Callback de progresso (0-100)
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const error = validateImageFile(file)
  if (error) throw new Error(error)

  const timestamp = Date.now()
  const extension = file.name.split('.').pop()
  const path = `products/${productId}/${timestamp}.${extension}`
  const storageRef = ref(storage, path)

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(Math.round(progress))
      },
      (error) => {
        console.error('Erro no upload:', error)
        reject(new Error(`Falha no upload: ${error.message}`))
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadUrl)
      }
    )
  })
}

/**
 * Faz upload da logo da marca.
 */
export async function uploadBrandLogo(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const error = validateImageFile(file)
  if (error) throw new Error(error)

  const extension = file.name.split('.').pop()
  const path = `branding/logo.${extension}`
  const storageRef = ref(storage, path)

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(Math.round(progress))
      },
      (error) => {
        console.error('Erro no upload da logo:', error)
        reject(new Error(`Falha no upload da logo: ${error.message}`))
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadUrl)
      }
    )
  })
}

/**
 * Faz upload da imagem hero da página inicial.
 */
export async function uploadHeroImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const error = validateImageFile(file)
  if (error) throw new Error(error)

  const extension = file.name.split('.').pop()
  const path = `branding/hero.${extension}`
  const storageRef = ref(storage, path)

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(Math.round(progress))
      },
      (error) => reject(new Error(`Falha no upload: ${error.message}`)),
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadUrl)
      }
    )
  })
}

/**
 * Exclui uma imagem do Storage a partir da URL de download.
 * Extrai o caminho da URL e exclui o objeto.
 * Falha silenciosamente se a imagem não existir.
 */
export async function deleteImageByUrl(url: string): Promise<void> {
  try {
    const storageRef = getStorageRefFromUrl(url)
    if (storageRef) {
      await deleteObject(storageRef)
    }
  } catch (error: unknown) {
    const firebaseError = error as { code?: string }
    if (firebaseError.code === 'storage/object-not-found') {
      // Imagem já não existe, ignora o erro
      return
    }
    console.error('Erro ao excluir imagem:', error)
    throw error
  }
}

/**
 * Obtém referência do Storage a partir de uma URL de download do Firebase.
 */
function getStorageRefFromUrl(url: string): StorageReference | null {
  try {
    // URL do Firebase Storage tem o formato:
    // https://firebasestorage.googleapis.com/v0/b/BUCKET/o/PATH?token=...
    const decodedUrl = decodeURIComponent(url)
    const match = decodedUrl.match(/\/o\/(.+?)(\?|$)/)
    if (!match) return null
    const path = match[1]
    return ref(storage, path)
  } catch {
    return null
  }
}

/**
 * Exclui todas as imagens de um produto.
 */
export async function deleteProductImages(imageUrls: string[]): Promise<void> {
  await Promise.allSettled(imageUrls.map((url) => deleteImageByUrl(url)))
}
