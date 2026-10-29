import type { ReactNode } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

import { makeStyles } from '../../theme'

export function Screen({ children }: { children: ReactNode }) {
  const styles = useStyles()
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      {children}
    </SafeAreaView>
  )
}

const useStyles = makeStyles((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.canvas,
  },
}))
