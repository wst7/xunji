import { StyleSheet } from 'react-native'
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native'

import { useTheme } from './ThemeProvider'
import { darkTheme, lightTheme } from './themes'
import type { AppTheme } from './themes'

export type StyleMap = Record<string, ViewStyle | TextStyle | ImageStyle>

/**
 * Build both schemes once at module load and hand back a hook. Components keep
 * using `styles.foo`, while colors follow the system without rebuilding styles
 * on every render.
 */
export function makeStyles<T extends StyleMap>(factory: (theme: AppTheme) => T) {
  const light = StyleSheet.create(factory(lightTheme) as StyleMap) as unknown as T
  const dark = StyleSheet.create(factory(darkTheme) as StyleMap) as unknown as T
  return function useStyles(): T {
    return useTheme().dark ? dark : light
  }
}
