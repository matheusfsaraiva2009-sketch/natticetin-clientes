import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from 'firebase/auth'
import { onAuthChange, checkIsAdmin } from '../services/auth'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  adminChecked: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAdmin: false,
  isLoading: true,
  adminChecked: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [adminChecked, setAdminChecked] = useState(false)

  const verifyAdmin = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false)
      setAdminChecked(true)
      return
    }
    const admin = await checkIsAdmin(currentUser)
    setIsAdmin(admin)
    setAdminChecked(true)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      setUser(currentUser)
      setIsLoading(false)
      await verifyAdmin(currentUser)
    })
    return unsubscribe
  }, [verifyAdmin])

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, adminChecked }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
