import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

// Coleção que armazena UIDs autorizados como administradores
const ADMINS_COLLECTION = 'admins'

/**
 * Faz login com e-mail e senha.
 * Retorna o usuário autenticado ou lança erro.
 */
export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

/**
 * Faz logout da conta atual.
 */
export async function signOutUser(): Promise<void> {
  await signOut(auth)
}

/**
 * Verifica se o usuário atual é administrador autorizado.
 * A verificação é feita no Firestore (coleção 'admins').
 * As regras de segurança do Firestore garantem que apenas admins podem escrever nessa coleção.
 */
export async function checkIsAdmin(user: User): Promise<boolean> {
  try {
    const adminRef = doc(db, ADMINS_COLLECTION, user.uid)
    const adminSnap = await getDoc(adminRef)
    return adminSnap.exists() && adminSnap.data()?.isAdmin === true
  } catch (error) {
    console.error('Erro ao verificar permissão administrativa:', error)
    return false
  }
}

/**
 * Observa mudanças no estado de autenticação.
 * Retorna função de cancelamento (unsubscribe).
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * Retorna o usuário atual (pode ser null).
 */
export function getCurrentUser(): User | null {
  return auth.currentUser
}
