import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { StoreSettings } from '../types'
import { subscribeToStoreSettings, DEFAULT_SETTINGS } from '../services/settings'

interface SettingsContextValue {
  settings: StoreSettings
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  isLoading: true,
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToStoreSettings(
      (newSettings) => {
        setSettings(newSettings)
        setIsLoading(false)
      },
      (error) => {
        console.error('Erro ao carregar configurações:', error)
        setIsLoading(false)
      }
    )
    return unsubscribe
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
