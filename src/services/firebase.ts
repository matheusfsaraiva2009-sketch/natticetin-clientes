import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Configurações do Firebase vindas das variáveis de ambiente
// Configure o arquivo .env.local com as credenciais do seu projeto Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBWNHUPU3vV3Omdj_W5KyTfKNOlCRG7UGM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'siteclientes-9be6b.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'siteclientes-9be6b',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'siteclientes-9be6b.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '94856436267',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:94856436267:web:2d47b7a9670113b348e86e',
}

// Inicializa a aplicação Firebase
const app = initializeApp(firebaseConfig)

// Exporta os serviços Firebase
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app
