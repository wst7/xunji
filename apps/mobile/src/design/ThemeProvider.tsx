import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { useColorScheme } from 'react-native'

import { darkTheme, lightTheme } from './themes'
import type { AppTheme } from './themes'

const ThemeContext = createContext<AppTheme>(lightTheme)

interface ThemeProviderProps {
  children: ReactNode
  /** Force a scheme for screenshots or debugging; otherwise follow the system. */
  scheme?: 'light' | 'dark'
}

export function ThemeProvider({ children, scheme }: ThemeProviderProps) {
  const system = useColorScheme()
  const resolved = scheme ?? (system === 'dark' ? 'dark' : 'light')
  const theme = resolved === 'dark' ? darkTheme : lightTheme
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext)
}
