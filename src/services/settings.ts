import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { StoreSettings } from '../types'

const SETTINGS_DOC = 'settings/store'

// Configurações padrão (exibidas quando o documento ainda não existe)
export const DEFAULT_SETTINGS: StoreSettings = {
  brandName: 'Nati Cetim',
  logoUrl: '',
  tagline: 'Elegância e delicadeza em cada detalhe',
  description: 'Toucas dupla face e scrunchies de cetim artesanais, feitos com carinho para você.',
  whatsappNumber: '',
  instagramHandle: '',
  instagramUrl: '',
  footerText: '© 2026 Nati Cetim. Todos os direitos reservados.',
  heroImageUrl: '',
  heroTitle: 'Cuide do seu cabelo com elegância',
  heroSubtitle: 'Toucas dupla face e scrunchies de cetim que protegem e embelezam.',
  primaryEmail: '',
}

/**
 * Busca as configurações da loja uma vez.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const docRef = doc(db, SETTINGS_DOC)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(docSnap.data() as Partial<StoreSettings>) }
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Observa as configurações da loja em tempo real.
 */
export function subscribeToStoreSettings(
  callback: (settings: StoreSettings) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const docRef = doc(db, SETTINGS_DOC)

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(DEFAULT_SETTINGS)
        return
      }
      const settings = {
        ...DEFAULT_SETTINGS,
        ...(snapshot.data() as Partial<StoreSettings>),
      }
      callback(settings)
    },
    (error) => {
      console.error('Erro ao observar configurações:', error)
      onError?.(error)
    }
  )
}

/**
 * Salva as configurações da loja (merge para preservar campos não enviados).
 */
export async function saveStoreSettings(
  settings: Partial<StoreSettings>
): Promise<void> {
  const docRef = doc(db, SETTINGS_DOC)
  await setDoc(
    docRef,
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
