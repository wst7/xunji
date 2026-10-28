import { useRouter } from 'expo-router'

import { AuthForm } from '../components/AuthForm'
import { useAuth } from '../auth/AuthProvider'

export function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()

  return (
    <AuthForm
      title="欢迎回来"
      submitLabel="登录"
      onSubmit={signIn}
      footerText="还没有账号？"
      footerLinkLabel="注册"
      onFooterPress={() => router.replace('/register')}
    />
  )
}
