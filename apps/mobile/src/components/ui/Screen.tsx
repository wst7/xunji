import { StyleSheet } from 'react-native'
import type { ReactNode } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '../../theme'

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
})
